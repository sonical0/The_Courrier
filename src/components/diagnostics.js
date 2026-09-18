/**
 * Tampon de diagnostic exportable.
 *
 * POURQUOI : quand quelque chose casse chez un utilisateur — un appel qui echoue,
 * une image qui ne charge pas, une erreur JS — il n'y a aujourd'hui aucune trace
 * a lui demander. Ce module enregistre en continu ce qui se passe dans l'onglet
 * et permet de l'exporter en un fichier JSON a joindre a un rapport.
 *
 * AUCUN SECRET N'Y ENTRE. C'est la regle principale, et elle est appliquee a
 * deux niveaux :
 *
 *  1. Les identifiants ne sont jamais enregistres. Le nom d'utilisateur et la
 *     cle d'API deviennent une empreinte SHA-256 tronquee. Elle permet de relier
 *     entre eux les evenements d'un meme compte — ce dont on a besoin pour
 *     deboguer — sans jamais detenir la valeur.
 *
 *  2. Filet de securite : tout texte enregistre passe par `expurger()`, qui
 *     remplace ce qui ressemble a une cle Nexus par [EXPURGE]. Si un message
 *     d'erreur d'une bibliotheque tierce recopiait une cle, elle ne sortirait
 *     pas d'ici.
 *
 * Pourquoi une empreinte plutot qu'un chiffrement : chiffrer suppose une cle,
 * qui devrait vivre quelque part — et comme le journal doit rester lisible pour
 * etre utile, cette cle finirait a cote du journal. Une empreinte non
 * reversible atteint le but reel (correler) sans creer ce probleme.
 */

const CAPACITE = 200; // tampon circulaire : au-dela, les plus anciens sortent
const CLE_STOCKAGE = "courrier_diagnostics";
const TAILLE_MAX = 120_000; // octets, garde-fou contre la saturation du stockage

let tampon = [];
let installe = false;

/** Empreintes deja calculees, pour ne pas rehacher a chaque appel. */
const empreintes = new Map();

/**
 * Empreinte courte et non reversible, servant d'identifiant de correlation.
 * Un meme compte produit toujours la meme empreinte dans un meme journal.
 */
async function empreinte(valeur) {
  if (!valeur) return null;
  if (empreintes.has(valeur)) return empreintes.get(valeur);
  try {
    const octets = new TextEncoder().encode(String(valeur));
    const condensat = await crypto.subtle.digest("SHA-256", octets);
    const hex = Array.from(new Uint8Array(condensat))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 8);
    empreintes.set(valeur, hex);
    return hex;
  } catch {
    return "indisponible";
  }
}

/**
 * Filet de securite : masque ce qui ressemble a une cle d'API Nexus.
 * Format observe : base64 avec des separateurs `--`, typiquement 90+ caracteres.
 */
const MOTIF_CLE = /[A-Za-z0-9+/=]{20,}--[A-Za-z0-9+/=]{10,}--[A-Za-z0-9+/=]{10,}/g;

export function expurger(texte) {
  if (typeof texte !== "string") return texte;
  return texte
    .replace(MOTIF_CLE, "[EXPURGE:cle]")
    // Une cle passee par erreur en parametre d'URL ne doit pas survivre non plus.
    .replace(/([?&](apikey|api_key|key|token)=)[^&\s]+/gi, "$1[EXPURGE]");
}

function ecrire(entree) {
  tampon.push({ t: new Date().toISOString(), ...entree });
  if (tampon.length > CAPACITE) tampon = tampon.slice(-CAPACITE);
  persister();
}

/** Le tampon survit a un rechargement : un bug se raconte souvent en deux temps. */
function persister() {
  try {
    let charge = JSON.stringify(tampon);
    while (charge.length > TAILLE_MAX && tampon.length > 10) {
      tampon = tampon.slice(Math.ceil(tampon.length / 4));
      charge = JSON.stringify(tampon);
    }
    localStorage.setItem(CLE_STOCKAGE, charge);
  } catch {
    // Stockage plein ou refuse : le tampon memoire reste utilisable.
  }
}

function restaurer() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (brut) tampon = JSON.parse(brut).slice(-CAPACITE);
  } catch {
    tampon = [];
  }
}

/**
 * Branche les collecteurs. Idempotent : un double appel ne double pas les
 * entrees, ce qui compte avec le rendu en double du mode strict de React.
 */
export function installer() {
  if (installe || typeof window === "undefined") return;
  installe = true;
  restaurer();

  ecrire({ type: "session", url: window.location.pathname, ua: navigator.userAgent.slice(0, 120) });

  window.addEventListener("error", (e) => {
    ecrire({
      type: "erreur-js",
      message: expurger(e.message || ""),
      source: (e.filename || "").split("/").pop(),
      ligne: e.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const raison = e.reason?.message || String(e.reason || "");
    ecrire({ type: "promesse-rejetee", message: expurger(raison).slice(0, 300) });
  });

  // Les violations CSP sont silencieuses en console pour l'utilisateur : les
  // capturer evite d'avoir a lui demander d'ouvrir les outils de developpement.
  document.addEventListener("securitypolicyviolation", (e) => {
    ecrire({
      type: "violation-csp",
      directive: e.violatedDirective,
      bloque: expurger(e.blockedURI || "inline").slice(0, 200),
    });
  });

  const fetchOrigine = window.fetch;
  window.fetch = async function (...args) {
    const [entree, init] = args;
    const url = typeof entree === "string" ? entree : entree?.url || "";
    // Seuls les appels de l'application nous interessent.
    if (!url.includes("/api/")) return fetchOrigine.apply(this, args);

    // Les identifiants voyagent dans ces en-tetes : on les remplace par une
    // empreinte AVANT tout enregistrement, ils n'entrent jamais dans le tampon.
    const entetes = new Headers(init?.headers || {});
    const compte = await empreinte(entetes.get("X-Nexus-Username"));

    const debut = performance.now();
    try {
      const reponse = await fetchOrigine.apply(this, args);
      ecrire({
        type: "api",
        methode: init?.method || "GET",
        url: expurger(url.replace(window.location.origin, "")),
        statut: reponse.status,
        ms: Math.round(performance.now() - debut),
        compte,
        // En-tetes de diagnostic poses par le Worker : ils disent d'ou vient la
        // reponse et si les protections sont actives.
        cacheSteam: reponse.headers.get("X-Steam-Cache") || undefined,
        perime: reponse.headers.get("X-Steam-Stale") || undefined,
        limiteur: reponse.headers.get("X-Edge-RateLimit") || undefined,
      });
      return reponse;
    } catch (e) {
      ecrire({
        type: "api",
        methode: init?.method || "GET",
        url: expurger(url.replace(window.location.origin, "")),
        statut: "echec-reseau",
        ms: Math.round(performance.now() - debut),
        compte,
        message: expurger(e.message || "").slice(0, 200),
      });
      throw e;
    }
  };
}

export function entrees() {
  return [...tampon];
}

export function vider() {
  tampon = [];
  try {
    localStorage.removeItem(CLE_STOCKAGE);
  } catch {
    /* sans effet */
  }
}

/** Construit le rapport, sans jamais lire les identifiants stockes. */
export function rapport() {
  const parType = tampon.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const echecs = tampon.filter(
    (e) => e.type === "api" && (e.statut === "echec-reseau" || Number(e.statut) >= 400)
  );

  return {
    genereLe: new Date().toISOString(),
    application: "The Courrier",
    page: window.location.pathname,
    navigateur: navigator.userAgent,
    resume: {
      entrees: tampon.length,
      parType,
      appelsEnEchec: echecs.length,
      // De quoi voir tout de suite si le probleme se concentre sur une route.
      routesEnEchec: [...new Set(echecs.map((e) => e.url))],
    },
    avertissement:
      "Aucun identifiant n'est present : le nom d'utilisateur est reduit a une empreinte SHA-256 tronquee, et tout texte est expurge des cles detectees.",
    entrees: tampon,
  };
}

/** Declenche le telechargement du rapport. */
export function exporter() {
  const donnees = JSON.stringify(rapport(), null, 2);
  const blob = new Blob([donnees], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `the-courrier-diagnostic-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
