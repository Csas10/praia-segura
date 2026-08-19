import type { PublicForecast, WeatherDay } from '@/shared/forecast';
import ForecastStatusBadge from './ForecastStatusBadge';

export default function WeatherForecastList({ forecast }: { forecast: PublicForecast<WeatherDay>[] }) {
  return (
    <ul className="weather-forecast-list" aria-label="Previsão do tempo para até sete dias">
      {forecast.slice(0, 7).map((item) => (
        <li key={item.validDate ?? item.value?.date ?? item.fetchedAt}>
          <div>
            <strong>{item.value?.date ?? item.validDate ?? 'Data não informada'}</strong>
            {item.value ? (
              <span>
                {item.value.condition || 'Condição não descrita pela fonte'} · mínima {item.value.minimumCelsius} °C · máxima {item.value.maximumCelsius} °C · UV {item.value.uvIndex}
              </span>
            ) : <span>Não há dados para esta data.</span>}
          </div>
          <ForecastStatusBadge stale={item.stale} unavailable={item.quality === 'unavailable'} />
        </li>
      ))}
    </ul>
  );
}
