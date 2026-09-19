import { Link } from "react-router-dom";

/**
 * Page 404 de l'application.
 *
 * Sans elle, une URL inconnue faisait remonter l'erreur jusqu'au routeur, qui
 * affichait son ecran par defaut : "Unexpected Application Error! ... Hey
 * developer, you can provide a way better UX than this". Destine au
 * developpeur, montre a l'utilisateur, et sans aucun retour vers l'app.
 */
export default function NotFoundPage() {
  return (
    <div className="cr-enveloppe py-8 cr-lecture">
      <p className="cr-mono m-0 mb-2" style={{ color: "var(--cr-muted)" }}>
        Erreur 404
      </p>
      <h1 className="text-3xl font-semibold mb-2">Cette page n’existe pas</h1>
      <p className="mb-6">
        Le lien est peut-être périmé, ou l’adresse comporte une faute de frappe.
      </p>
      <Link to="/" className="cr-bouton cr-bouton-principal" style={{ textDecoration: "none" }}>
        Retour au tableau de bord
      </Link>
    </div>
  );
}
