import useWeather from "../components/useWeather";

export default function BootstrapPage() {
  const weather = useWeather();

  if (!weather) return <p className="text-center mt-5">Chargement...</p>;

  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4">🌤️ Météo à Bordeaux (Bootstrap)</h2>
      <div className="d-flex flex-column flex-md-row justify-content-around align-items-center">
        <div className="card p-3 m-2 shadow-sm">
          <h4>Température</h4>
          <p className="fs-4">{weather.temperature} °C</p>
        </div>
        <div className="card p-3 m-2 shadow-sm">
          <h4>Vent</h4>
          <p className="fs-4">{weather.windspeed} km/h</p>
        </div>
      </div>
    </div>
  );
}