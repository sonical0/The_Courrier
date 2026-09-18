import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";

/**
 * Filet de securite du routeur : attrape ce qu'aucune route ne gere.
 *
 * Deux cas distincts, que l'ecran par defaut de React Router confondait en
 * affichant sa page destinee aux developpeurs :
 *  - une reponse de route 404 -> on rend la vraie page 404 ;
 *  - une erreur d'execution -> message sobre, sans pile d'appels ni detail
 *    technique, avec un retour vers l'application.
 *
 * Le detail part dans la console : utile au developpeur, invisible pour
 * l'utilisateur.
 */
export default function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  if (error) console.error("Erreur de route :", error);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="pico-card p-6 text-center border-red-500 dark:border-red-600">
        <p className="text-5xl mb-3" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
          Une erreur est survenue
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          L'affichage de cette page a échoué. Recharger suffit le plus souvent ;
          si le problème persiste, revenez au tableau de bord.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            Recharger
          </button>
          <Link
            to="/"
            className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
