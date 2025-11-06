import useWeather from "../components/useWeather";

export default function TailwindPage() {
  const weather = useWeather();

  if (!weather) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">
        🌦️ Météo à Bordeaux
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="pico-card p-6 text-center">
          <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Température
          </h4>
          <p className="text-4xl font-bold text-pico-primary">
            {weather.temperature} °C
          </p>
        </div>
        
        <div className="pico-card p-6 text-center">
          <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Vent
          </h4>
          <p className="text-4xl font-bold text-pico-primary">
            {weather.windspeed} km/h
          </p>
        </div>

        <div className="pico-card p-6 text-center md:col-span-2 lg:col-span-1">
          <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Conditions
          </h4>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {weather.temperature > 25 ? "☀️ Ensoleillé" : 
             weather.temperature > 15 ? "⛅ Nuageux" : "🌧️ Frais"}
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-2xl mx-auto pico-card p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          À propos de cette page
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-3">
          Cette page utilise Tailwind CSS avec un design inspiré de PicoCSS. 
          Le layout est entièrement responsive et s'adapte automatiquement :
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
          <li><strong>Mobile :</strong> 1 colonne</li>
          <li><strong>Tablette :</strong> 2 colonnes</li>
          <li><strong>Desktop :</strong> 3 colonnes</li>
        </ul>
        <p className="text-slate-600 dark:text-slate-400 mt-4">
          Utilisez le bouton dans le header pour basculer entre le mode jour et nuit !
        </p>
      </div>
    </div>
  );
}