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
    <div className="container mx-auto px-4 py-8">
      <div className="pico-card p-6 text-center">
        <p className="text-5xl mb-3" aria-hidden="true">
          🧭
        </p>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Cette page n'existe pas
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Le lien est peut-être périmé, ou l'adresse comporte une faute de frappe.
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
