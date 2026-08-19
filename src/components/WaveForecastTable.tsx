import type { PublicForecast, WavePeriod } from '@/shared/forecast';
import ForecastStatusBadge from './ForecastStatusBadge';

function utcDate(value: string): string {
  return value.slice(0, 10);
}

function utcTime(value: string): string {
  return `${value.slice(11, 16)} UTC`;
}

export default function WaveForecastTable({
  forecast,
  product,
}: {
  forecast: PublicForecast<WavePeriod>[];
  product: 'waves-daily' | 'waves-6d';
}) {
  const rows = product === 'waves-daily' ? forecast.slice(0, 3) : forecast;
  return (
    <div className="forecast-table-wrap">
      <table className="wave-forecast-table">
        <caption>{product === 'waves-daily' ? 'Ondas: três períodos do boletim diário' : 'Ondas: horizonte de até seis dias, agrupado por data UTC'}</caption>
        <thead><tr><th scope="col">Data (UTC)</th><th scope="col">Horário</th><th scope="col">Ondulação</th><th scope="col">Vento</th><th scope="col">Estado</th></tr></thead>
        <tbody>
          {rows.map((item, index) => {
            const value = item.value;
            const timestamp = value?.validAt ?? item.validAt;
            const previous = index ? rows[index - 1].value?.validAt ?? rows[index - 1].validAt : null;
            const showDate = Boolean(timestamp) && (!previous || utcDate(timestamp as string) !== utcDate(previous as string));
            return (
              <tr key={`${timestamp ?? item.fetchedAt}-${index}`}>
                <th scope="row">{showDate ? utcDate(timestamp as string) : ''}</th>
                <td>{timestamp ? utcTime(timestamp) : 'Não informado'}</td>
                <td>{value ? `${value.agitation} · ${value.waveHeightMeters} m · ${value.waveDirection}` : 'Não disponível'}</td>
                <td>{value ? `${value.windKmh} km/h · ${value.windDirection}` : 'Não disponível'}</td>
                <td><ForecastStatusBadge stale={item.stale} unavailable={item.quality === 'unavailable'} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
