import type { ForecastMetadata as ForecastMetadataValue } from '@/shared/forecast';

interface ForecastMetadataProps {
  metadata: ForecastMetadataValue;
}

function formatUtc(value: string | null): string {
  if (!value) return 'Não informado';
  return `${value.replace('T', ' ').replace(/\.000Z$/, '').replace(/Z$/, '')} UTC`;
}

function approvedPublicUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.cptec.inpe.br' ? url.href : null;
  } catch {
    return null;
  }
}

export default function ForecastMetadata({ metadata }: ForecastMetadataProps) {
  const sourceUrl = approvedPublicUrl(metadata.sourceUrl);
  return (
    <dl className="forecast-metadata">
      <div><dt>Fonte</dt><dd>{sourceUrl ? <a href={sourceUrl}>CPTEC/INPE</a> : 'CPTEC/INPE'}</dd></div>
      <div><dt>Emitido em</dt><dd>{metadata.issuedDate ?? formatUtc(metadata.issuedAt)}</dd></div>
      <div><dt>Atualizado em</dt><dd>{formatUtc(metadata.fetchedAt)}</dd></div>
      <div><dt>Válido em</dt><dd>{metadata.validDate ?? formatUtc(metadata.validAt)}</dd></div>
      <div><dt>Cobertura</dt><dd>{metadata.coverage ?? 'Não informada'}</dd></div>
      <div><dt>Estado</dt><dd>{metadata.stale ? 'Atualização atrasada' : 'Previsão estimada'}</dd></div>
      {metadata.expiresAt && <div><dt>Atualização recomendada até</dt><dd>{formatUtc(metadata.expiresAt)}</dd></div>}
    </dl>
  );
}
