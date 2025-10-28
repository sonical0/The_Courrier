import useWeather from "../components/useWeather";

export default function TailwindPage() {
  const weather = useWeather();

  if (!weather) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="flex flex-col items-center justify-center mt-10">
      <h2 className="text-2xl font-bold mb-6">🌦️ Météo à Bordeaux (Tailwind)</h2>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <div className="bg-white shadow-md rounded-xl p-6 text-center w-64">
          <h4 className="text-lg font-semibold mb-2">Température</h4>
          <p className="text-2xl">{weather.temperature} °C</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-6 text-center w-64">
          <h4 className="text-lg font-semibold mb-2">Vent</h4>
          <p className="text-2xl">{weather.windspeed} km/h</p>
        </div>
      </div>
    </div>
  );
}