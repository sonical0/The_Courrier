import { render, screen } from '@testing-library/react';
import App from './App';

test('monte le router et rend la route par defaut', async () => {
  render(<App />);
  // Sans credentials stockes, la route index rend son etat d'accueil.
  // Avant la correction du 401 fantome, cette branche etait inatteignable :
  // la requete sans headers echouait et la page affichait l'erreur a la place.
  expect(
    await screen.findByText(/Bienvenue sur The Courrier/i)
  ).toBeInTheDocument();
});
