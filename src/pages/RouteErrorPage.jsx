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
    <div className="cr-enveloppe py-8 cr-lecture">
      <p className="m-0 mb-2">
        <span className="cr-etiquette cr-etiquette-critique">Erreur</span>
      </p>
      <h1 className="text-3xl font-semibold mb-2">Une erreur est survenue</h1>
      <p className="mb-6">
        L’affichage de cette page a échoué. Recharger suffit le plus souvent ; si le problème
        persiste, revenez au tableau de bord.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="cr-bouton cr-bouton-principal"
        >
          Recharger
        </button>
        <Link to="/" className="cr-bouton" style={{ textDecoration: "none" }}>
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
