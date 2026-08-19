interface ForecastStatusBadgeProps {
  stale: boolean;
  unavailable: boolean;
}

export default function ForecastStatusBadge({ stale, unavailable }: ForecastStatusBadgeProps) {
  if (unavailable) {
    return <span className="forecast-status forecast-status--unavailable">Indisponível</span>;
  }
  if (stale) {
    return <span className="forecast-status forecast-status--stale">Atualização atrasada</span>;
  }
  return <span className="forecast-status forecast-status--current">Previsão estimada</span>;
}
