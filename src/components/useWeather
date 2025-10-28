import { useEffect, useState } from "react";

export default function useWeather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch("<https://api.open-meteo.com/v1/forecast?latitude=44.84&longitude=-0.58&current_weather=true>")
      .then(res => res.json())
      .then(data => setWeather(data.current_weather))
      .catch(console.error);
  }, []);

  return weather;
}