// Exemple d'utilisation du hook useNexusCredentials

import useNexusCredentials from './components/useNexusCredentials';

function MyComponent() {
  const { 
    credentials,      // { username: string, apiKey: string } | null
    loading,          // boolean - true pendant le chargement initial
    saveCredentials,  // (username: string, apiKey: string) => boolean
    clearCredentials, // () => boolean
    hasCredentials    // boolean - true si credentials valides présents
  } = useNexusCredentials();

  // Exemple 1 : Sauvegarder des credentials
  const handleSave = () => {
    const success = saveCredentials('MonUsername', 'ma-cle-api-123');
    if (success) {
      console.log('Credentials sauvegardés !');
    }
  };

  // Exemple 2 : Supprimer les credentials
  const handleClear = () => {
    const success = clearCredentials();
    if (success) {
      console.log('Credentials supprimés !');
    }
  };

  // Exemple 3 : Vérifier si l'utilisateur est configuré
  if (!hasCredentials) {
    return <div>Veuillez configurer vos credentials</div>;
  }

  // Exemple 4 : Afficher les informations de l'utilisateur
  return (
    <div>
      <p>Connecté en tant que : {credentials.username}</p>
      <button onClick={handleClear}>Déconnexion</button>
    </div>
  );
}

// ============================================
// Exemple d'utilisation du hook useNexusMods
// ============================================

import useNexusMods from './components/useNexusMods';
import useNexusCredentials from './components/useNexusCredentials';

function MyModsComponent() {
  const { credentials } = useNexusCredentials();
  
  const { 
    loading,      // boolean - chargement en cours
    error,        // string | null - message d'erreur
    games,        // Array<{ key, domain, gameId, name }> - liste des jeux
    modsForGame,  // (gameKey: string) => Array<Mod> - mods pour un jeu
    refresh,      // () => Promise<void> - rafraîchir les données
    untrackMod    // (domain: string, modId: string) => Promise<{ success: boolean, error?: string }>
  } = useNexusMods(credentials);

  // Exemple 1 : Afficher les jeux disponibles
  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur: {error}</p>;

  return (
    <div>
      <h2>Jeux disponibles</h2>
      <ul>
        {games.map(game => (
          <li key={game.key}>
            {game.name} ({game.domain})
            <ModsList gameKey={game.key} modsForGame={modsForGame} />
          </li>
        ))}
      </ul>
      <button onClick={refresh}>Rafraîchir</button>
    </div>
  );
}

function ModsList({ gameKey, modsForGame }) {
  const mods = modsForGame(gameKey);
  
  return (
    <ul>
      {mods.map(mod => (
        <li key={mod.id}>
          {mod.name} - v{mod.version}
          {mod.previousVersion && <span> (précédent: v{mod.previousVersion})</span>}
        </li>
      ))}
    </ul>
  );
}

// Exemple 2 : Retirer un mod de la liste suivie
async function handleUntrackMod(domain, modId, modName) {
  if (!window.confirm(`Voulez-vous vraiment retirer "${modName}" ?`)) {
    return;
  }
  
  const result = await untrackMod(domain, modId);
  
  if (result.success) {
    console.log('Mod retiré avec succès !');
  } else {
    alert(`Erreur: ${result.error}`);
  }
}

// ============================================
// Structure des données de mods
// ============================================

/*
Mod {
  id: string | number,
  domain: string,
  name: string,
  version: string,
  previousVersion: string | null,
  author: string,
  authorId: string | number,
  picture: string | null,
  updatedAt: number, // timestamp epoch
  url: string,
  gameId: string | number,
  gameName: string,
  summary: string,
  changelog: Array<{
    version: string,
    changes: Array<string>
  }>,
  changelogUrl: string
}
*/

// ============================================
// Exemple de CredentialsModal
// ============================================

import CredentialsModal from './components/CredentialsModal';

function MyApp() {
  const [showModal, setShowModal] = useState(false);
  const { saveCredentials } = useNexusCredentials();

  const handleSave = (username, apiKey) => {
    if (saveCredentials(username, apiKey)) {
      setShowModal(false);
      alert('Identifiants sauvegardés !');
    } else {
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Configurer mes identifiants
      </button>

      <CredentialsModal
        show={showModal}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}  // optionnel
      />
    </div>
  );
}
