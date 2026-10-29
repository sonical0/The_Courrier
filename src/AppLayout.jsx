import { useState, useMemo, useRef, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import CredentialsModal from "./components/CredentialsModal";
import useNexusCredentials from "./components/useNexusCredentials";
import useNexusMods from "./components/useNexusMods";
import useLastVisit from "./components/useLastVisit";
import useTheme from "./components/useTheme";
import useSteamGames from "./components/useSteamGames";
import GameUpdateAlert from "./components/GameUpdateAlert";
import { exportConfig, importConfig } from "./components/useConfigBackup";
import { exporter as exporterDiagnostics } from "./components/diagnostics";
import useNotifications from "./components/useNotifications";

/**
 * Sections du site, déclarées une seule fois : la barre d'onglets et le
 * panneau replié lisent la même liste. L'ancienne version les écrivait deux
 * fois, ce qui avait déjà laissé diverger les libellés.
 */
const SECTIONS = [
  { to: "/", libelle: "Tableau de bord" },
  { to: "/actus", libelle: "Mises à jour" },
  { to: "/nexus-mods", libelle: "Mods suivis" },
  { to: "/incompatibility", libelle: "Incompatibilités" },
];

const LIBELLE_THEME = {
  systeme: "Thème système",
  light: "Thème clair",
  dark: "Thème sombre",
};
const ICONE_THEME = { systeme: "◐", light: "☀", dark: "☾" };

export default function AppLayout() {
  const { credentials, loading, saveCredentials, clearCredentials, hasCredentials, accounts, activeAccountId, switchAccount, removeAccount } = useNexusCredentials();
  const { loading: modsLoading, error: modsError, games, modsForGame, refresh, untrackMod } = useNexusMods(credentials, loading);
  const { countNew } = useLastVisit();
  const { supported: notifSupported, enabled: notifEnabled, permission: notifPermission, requestPermission, disableNotifications, notifyNewMods } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { choix, cycler } = useTheme();
  const location = useLocation();

  // Une section est active si le chemin correspond ; la racine est un cas à
  // part, sinon elle serait active partout.
  const estActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  const sectionCourante = (SECTIONS.find((s) => estActive(s.to)) || SECTIONS[0]).libelle;

  // Intégration Steam pour suivre les versions de jeux
  const {
    alerts: steamAlerts,
    dismissAlert,
    dismissAllAlerts,
    getSteamInfo
  } = useSteamGames(games);

  // Calculer le nombre de nouveaux mods
  const newModsCount = useMemo(() => {
    if (modsLoading || !games.length) return 0;
    const allMods = [];
    for (const g of games) {
      const key = g.domain || g.gameId || g.name;
      allMods.push(...modsForGame(key));
    }
    return countNew(allMods);
  }, [games, modsForGame, countNew, modsLoading]);

  useEffect(() => {
    if (!modsLoading && newModsCount > 0) {
      notifyNewMods(newModsCount);
    }
  }, [newModsCount, modsLoading, notifyNewMods]);

  const handleSaveCredentials = (username, apiKey) => {
    if (saveCredentials(username, apiKey)) {
      setShowModal(false);
      setIsMenuOpen(false);
    } else {
      alert("Erreur lors de la sauvegarde des identifiants");
    }
  };

  const handleClearCredentials = () => {
    if (window.confirm("Voulez-vous vraiment supprimer vos identifiants Nexus Mods ?")) {
      clearCredentials();
    }
  };

  const importInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await importConfig(file);
    if (result.success) {
      setImportStatus(`Configuration restauree (${result.restored} element${result.restored > 1 ? "s" : ""}). Rechargement...`);
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setImportStatus(`Erreur : ${result.error}`);
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  const shouldShowModal = showModal || (!loading && !hasCredentials);

  return (
    <div className="min-h-screen" style={{ background: "var(--cr-ground)", color: "var(--cr-ink)" }}>
      {/* ================================================================
          En-tête. Un seul balisage, replié par CSS.

          L'ancienne version dupliquait intégralement la navigation et les
          actions entre une version bureau (`xl:flex`) et un panneau mobile —
          285 lignes, deux jeux de styles à maintenir, et un point de bascule à
          1280 px qui affichait le menu replié sur des écrans larges.

          Ici : les sections vivent dans une barre d'onglets visible dès 768 px
          et dans le panneau en dessous ; les actions secondaires sont toujours
          dans le panneau, à n'importe quelle taille.
          ================================================================ */}
      <header
        className="sticky z-20 border-b"
        style={{
          top: "env(safe-area-inset-top, 0px)",
          background: "color-mix(in srgb, var(--cr-ground) 92%, transparent)",
          backdropFilter: "blur(8px)",
          borderColor: "var(--cr-line)",
        }}
      >
        <div className="cr-enveloppe flex items-center gap-3 py-3 flex-wrap">
          <Link to="/" className="flex items-center gap-3 no-underline mr-auto" style={{ color: "inherit" }}>
            <img src="/logo512.png" alt="" className="w-9 h-9" aria-hidden="true" />
            <span className="flex items-baseline gap-2">
              <strong className="text-xl" style={{ fontFamily: "var(--cr-display)", letterSpacing: "-0.015em" }}>
                The Courrier
              </strong>
              <span className="text-sm hidden sm:inline" style={{ color: "var(--cr-muted)" }}>
                suivi de mods
              </span>
            </span>
          </Link>

          {hasCredentials && (
            <span
              className="cr-etiquette cr-etiquette-ok hidden sm:inline-flex"
              title={`Connecté en tant que ${credentials?.username}`}
            >
              {credentials?.username}
            </span>
          )}

          {/* Trois états : système, clair, sombre. Le libellé passe en lecture
              d'écran seule sous 640 px, où il poussait les autres boutons à la
              ligne. */}
          <button
            type="button"
            className="cr-bouton"
            onClick={cycler}
            aria-pressed={choix !== "systeme"}
            title="Changer de thème : système, clair, sombre"
          >
            <span aria-hidden="true">{ICONE_THEME[choix]}</span>
            <span className="hidden sm:inline">{LIBELLE_THEME[choix]}</span>
            <span className="sm:hidden cr-visuellement-cache">{LIBELLE_THEME[choix]}</span>
          </button>

          <button
            type="button"
            className="cr-bouton cr-bouton-principal"
            onClick={() => setShowModal(true)}
            title={hasCredentials ? "Modifier les identifiants" : "Configurer les identifiants"}
          >
            Config
          </button>

          {/* Le bouton porte le nom de la section courante : replier la
              navigation ne doit pas faire perdre le repère « où suis-je ». */}
          <button
            type="button"
            className="cr-bouton"
            id="cr-burger"
            aria-expanded={isMenuOpen}
            aria-controls="cr-panneau"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <span aria-hidden="true" className="grid gap-[3px]">
              <span className="block w-[18px] h-[2px] rounded" style={{ background: "currentColor" }} />
              <span className="block w-[18px] h-[2px] rounded" style={{ background: "currentColor" }} />
              <span className="block w-[18px] h-[2px] rounded" style={{ background: "currentColor" }} />
            </span>
            <span className="md:hidden">
              <span className="cr-visuellement-cache">Navigation — section courante : </span>
              <strong>{sectionCourante}</strong>
            </span>
            <span className="hidden md:inline">Menu</span>
          </button>
        </div>

        {/* Onglets de section : visibles dès 768 px, sinon dans le panneau. */}
        <nav className="hidden md:block border-t" style={{ borderColor: "var(--cr-line)" }} aria-label="Sections">
          <ul className="cr-enveloppe flex gap-1 list-none m-0 p-0">
            {SECTIONS.map((s) => (
              <li key={s.to}>
                <Link
                  to={s.to}
                  className="inline-flex items-center gap-2 px-3 font-semibold no-underline"
                  style={{
                    minHeight: "44px",
                    color: estActive(s.to) ? "var(--cr-ink)" : "var(--cr-muted)",
                    borderBottom: `3px solid ${estActive(s.to) ? "var(--cr-accent)" : "transparent"}`,
                  }}
                  aria-current={estActive(s.to) ? "page" : undefined}
                >
                  {s.libelle}
                  {s.to === "/actus" && newModsCount > 0 && (
                    <span
                      className="cr-mono text-sm rounded-full px-2"
                      style={{ background: "var(--cr-accent-soft)", color: "var(--cr-accent)" }}
                    >
                      {newModsCount > 99 ? "99+" : newModsCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {isMenuOpen && (
          <div id="cr-panneau" className="cr-enveloppe pb-4 pt-3 border-t" style={{ borderColor: "var(--cr-line)" }}>
            {/* Sections : uniquement quand la barre d'onglets est repliée. */}
            <div className="md:hidden flex flex-col gap-1 mb-3">
              {SECTIONS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  onClick={() => setIsMenuOpen(false)}
                  className="cr-filtre no-underline"
                  aria-current={estActive(s.to) ? "page" : undefined}
                  style={
                    estActive(s.to)
                      ? {
                          background: "var(--cr-accent-soft)",
                          borderColor: "var(--cr-accent)",
                          color: "var(--cr-accent)",
                          fontWeight: 600,
                        }
                      : undefined
                  }
                >
                  {s.libelle}
                  {s.to === "/actus" && newModsCount > 0 && (
                    <span className="cr-compte">{newModsCount > 99 ? "99+" : newModsCount}</span>
                  )}
                </Link>
              ))}
            </div>

            <p className="text-sm font-semibold m-0 mb-2" style={{ color: "var(--cr-muted)" }}>
              Réglages
            </p>
            <div className="flex flex-wrap gap-2">
              {notifSupported && (
                <button
                  type="button"
                  className="cr-bouton"
                  onClick={notifEnabled ? disableNotifications : requestPermission}
                  disabled={notifPermission === "denied"}
                  aria-pressed={notifEnabled}
                  title={
                    notifPermission === "denied"
                      ? "Notifications bloquées par le navigateur"
                      : "Activer ou désactiver les notifications"
                  }
                >
                  Notifications {notifEnabled ? "activées" : "désactivées"}
                </button>
              )}
              <button type="button" className="cr-bouton" onClick={exportConfig} title="Exporter la configuration">
                Exporter la configuration
              </button>
              <button
                type="button"
                className="cr-bouton"
                onClick={() => importInputRef.current?.click()}
                title="Importer une configuration"
              >
                Importer
              </button>
              <button
                type="button"
                className="cr-bouton"
                onClick={exporterDiagnostics}
                title="Journal technique à joindre à un rapport — sans identifiants"
              >
                Diagnostic
              </button>
              {hasCredentials && (
                <button
                  type="button"
                  className="cr-bouton"
                  onClick={handleClearCredentials}
                  style={{ color: "var(--cr-crit)", borderColor: "var(--cr-crit)" }}
                  title="Supprimer les identifiants de ce navigateur"
                >
                  Supprimer mes identifiants
                </button>
              )}
            </div>

            {!hasCredentials && (
              <p className="text-sm mt-3 mb-0" style={{ color: "var(--cr-muted)" }}>
                Identifiants non configurés.
              </p>
            )}

            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="cr-visuellement-cache"
            />
            {importStatus && (
              <p className="text-sm mt-3 mb-0" style={{ color: "var(--cr-ink)" }}>
                {importStatus}
              </p>
            )}
          </div>
        )}
      </header>

      <CredentialsModal
        show={shouldShowModal}
        onSave={handleSaveCredentials}
        onCancel={hasCredentials ? () => setShowModal(false) : undefined}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSwitch={(id) => { switchAccount(id); setShowModal(false); }}
        onRemove={removeAccount}
      />

      {/* Le message flottait sous l'en-tête collant et le recouvrait par
          moments ; il est passé en bas, hors du chemin, et annoncé aux
          lecteurs d'écran puisqu'il apparaît sans action de leur part. */}
      {importStatus && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3 font-semibold"
          style={{
            bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
            background: "var(--cr-ink)",
            color: "var(--cr-ground)",
            borderRadius: "var(--cr-radius)",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          {importStatus}
        </div>
      )}

      {/* Alertes de mise à jour Steam */}
      <GameUpdateAlert
        alerts={steamAlerts}
        onDismiss={dismissAlert}
        onDismissAll={dismissAllAlerts}
      />

      <main>
        {/* steamAlerts descend jusqu'au tableau de bord : c'est la SEULE source
            de detection de mise a jour de jeu, fondee sur le changement de
            buildId Steam. Un second mecanisme (useGameVersions) existait et ne
            se declenchait jamais — il attendait un champ `version` que les
            objets `games` ne portent pas. Supprime le 2026-09-18. */}
        <Outlet context={{ credentials, getSteamInfo, loading: modsLoading, error: modsError, games, modsForGame, refresh, untrackMod, steamAlerts, dismissAlert, dismissAllAlerts }} />
      </main>
    </div>
  );
}
