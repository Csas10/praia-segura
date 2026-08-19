import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEstimatedForecast } from '../../domain/forecast';
import { HttpInvalidResponseError, HttpTimeoutError } from '../../http/fetch-with-timeout';
import {
  fetchDailyWaves,
  fetchSixDayWaves,
  fetchWeather7Days,
  HOMOLOGATED_LOCATIONS,
} from './client';

const location = HOMOLOGATED_LOCATIONS.find((item) => item.name === 'Ilhéus')!;

function response(xml: string, contentType = 'text/xml;charset=ISO-8859-1', status = 200): Response {
  return new Response(Buffer.from(xml, 'latin1'), { status, headers: { 'content-type': contentType } });
}

const header = '<?xml version="1.0" encoding="ISO-8859-1"?>';

function weatherXml(options: { duplicateDates?: boolean; invalidValues?: boolean } = {}): string {
  const dates = Array.from({ length: 7 }, (_, index) => `2026-08-${String(19 + index).padStart(2, '0')}`);
  if (options.duplicateDates) dates[6] = dates[5];
  const forecasts = dates
    .map(
      (date) =>
        `<previsao><dia>${date}</dia><tempo>pn</tempo><maxima>${options.invalidValues ? 18 : 28}</maxima><minima>${options.invalidValues ? 19 : 19}</minima><iuv>${options.invalidValues ? -1 : 5}</iuv></previsao>`,
    )
    .join('');
  return `${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>2026-08-18</atualizacao>${forecasts}</cidade>`;
}

function sixDayXml(
  count: number,
  options: { duplicate?: boolean; gap?: boolean; invalidHour?: boolean; nonConsecutive?: boolean; past?: boolean } = {},
): string {
  const start = Date.UTC(2026, 7, options.past ? 10 : 19, 0);
  const forecasts = Array.from({ length: count }, (_, index) => {
    let timestamp = start + index * 10_800_000;
    if (options.duplicate && index === 2) timestamp -= 10_800_000;
    if (options.gap && index >= 2) timestamp += 10_800_000;
    if (options.nonConsecutive && index === 8) timestamp += 86_400_000;
    const date = new Date(timestamp);
    const hour = options.invalidHour && index === 2 ? 1 : date.getUTCHours();
    const day = `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
    return `<previsao><dia>${day} ${String(hour).padStart(2, '0')}h Z</dia><agitacao>Fraco</agitacao><altura>1.0</altura><direcao>SE</direcao><vento>5</vento><vento_dir>SE</vento_dir></previsao>`;
  }).join('');
  return `${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>2026-08-18</atualizacao>${forecasts}</cidade>`;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CPTEC client', () => {
  it('decodes ISO-8859-1 and preserves accented location names', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(weatherXml()),
      ),
    );

    const result = await fetchWeather7Days(location);
    expect(result[0].value?.date).toBe('2026-08-19');
    expect(result[0].quality).toBe('estimated');
    expect(result[0].validDate).toBe('2026-08-19');
    expect(result[0].validAt).toBeNull();
    expect(result[0].issuedAt).toBeNull();
    expect(result[0].issuedDate).toBe('2026-08-18');
    expect(result[0].coverage).toBe('município (até 7 dias)');
  });

  it('parses daily waves with UTC timestamps and metric units', async () => {
    const period = (time: string) => `<dia>18-08-2026 ${time}h Z</dia><agitacao>Moderado</agitacao><altura>2.3</altura><direcao>SE</direcao><vento>8.7</vento><vento_dir>SE</vento_dir>`;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>18-08-2026</atualizacao><manha>${period('12')}</manha><tarde>${period('18')}</tarde><noite>${period('21')}</noite></cidade>`),
      ),
    );

    const result = await fetchDailyWaves(location);
    expect(result).toHaveLength(3);
    expect(result[0].validAt).toBe('2026-08-18T12:00:00.000Z');
    expect(result[0].validDate).toBeNull();
    expect(result[0].issuedAt).toBeNull();
    expect(result[0].issuedDate).toBe('2026-08-18');
    expect(result[0].value?.waveHeightMeters).toBe(2.3);
  });

  it.each([
    ['31-02-2026', 'update_date'],
    ['2026-08-18', 'update_date'],
    ['null', 'field_missing'],
  ])('rejects invalid daily wave update date %s', async (updateDate, stage) => {
    const period = (time: string) => `<dia>18-08-2026 ${time}h Z</dia><agitacao>Moderado</agitacao><altura>2.3</altura><direcao>SE</direcao><vento>8.7</vento><vento_dir>SE</vento_dir>`;
    const xml = `${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>${updateDate}</atualizacao><manha>${period('12')}</manha><tarde>${period('18')}</tarde><noite>${period('21')}</noite></cidade>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(xml)));
    await expect(fetchDailyWaves(location)).rejects.toMatchObject({
      name: 'CptecInvalidResponseError',
      stage,
    });
  });

  it.each([6, 7])('accepts %s valid weather records', async (count) => {
    const dates = Array.from({ length: count }, (_, index) => `2026-08-${String(19 + index).padStart(2, '0')}`);
    const forecasts = dates
      .map((date) => `<previsao><dia>${date}</dia><tempo>pn</tempo><maxima>28</maxima><minima>19</minima><iuv>5</iuv></previsao>`)
      .join('');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>2026-08-18</atualizacao>${forecasts}</cidade>`)));
    await expect(fetchWeather7Days(location)).resolves.toHaveLength(count);
  });

  it.each([5, 8])('rejects %s weather records', async (count) => {
    const dates = Array.from({ length: count }, (_, index) => `2026-08-${String(19 + index).padStart(2, '0')}`);
    const forecasts = dates
      .map((date) => `<previsao><dia>${date}</dia><tempo>pn</tempo><maxima>28</maxima><minima>19</minima><iuv>5</iuv></previsao>`)
      .join('');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>2026-08-18</atualizacao>${forecasts}</cidade>`)));
    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it.each<[string, { duplicateDates?: boolean; outOfOrder?: boolean; dateGap?: boolean }]>([
    ['duplicate dates', { duplicateDates: true }],
    ['out-of-order dates', { outOfOrder: true }],
    ['six-hour date gap', { dateGap: true }],
  ])('rejects weather dates with %s', async (_label, options) => {
    const dates = ['2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24'];
    if (options.duplicateDates) dates[5] = dates[4];
    if (options.outOfOrder) dates[4] = dates[2];
    if (options.dateGap) dates[4] = '2026-08-25';
    const forecasts = dates
      .map((date) => `<previsao><dia>${date}</dia><tempo>pn</tempo><maxima>28</maxima><minima>19</minima><iuv>5</iuv></previsao>`)
      .join('');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>2026-08-18</atualizacao>${forecasts}</cidade>`)));
    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects an invalid weather record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(weatherXml({ invalidValues: true }))));
    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it.each([40, 41, 48])('accepts %s temporally valid six-day wave records', async (count) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(sixDayXml(count))));
    await expect(fetchSixDayWaves(location)).resolves.toHaveLength(count);
  });

  it.each([39, 49])('rejects %s six-day wave records', async (count) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(sixDayXml(count))));
    await expect(fetchSixDayWaves(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it.each([
    ['duplicate timestamps', { duplicate: true }],
    ['six-hour gaps', { gap: true }],
    ['off-grid hours', { invalidHour: true }],
    ['non-consecutive dates', { nonConsecutive: true }],
    ['an expired horizon', { past: true }],
  ])('rejects six-day waves with %s', async (_label, options) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(sixDayXml(41, options))));
    await expect(fetchSixDayWaves(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects semantically invalid six-day wave fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(sixDayXml(40).replace('<altura>1.0</altura>', '<altura>-1</altura>'))));
    await expect(fetchSixDayWaves(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('constructs HTTPS URLs only from homologated CPTEC codes', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('probe'));
    vi.stubGlobal('fetch', fetchMock);
    for (const homologated of HOMOLOGATED_LOCATIONS) {
      await expect(fetchWeather7Days(homologated)).rejects.toBeInstanceOf(HttpInvalidResponseError);
      expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(`https://servicos.cptec.inpe.br/XML/cidade/7dias/${homologated.cptecCode}/previsao.xml`);
      await expect(fetchDailyWaves(homologated, 2)).rejects.toBeInstanceOf(HttpInvalidResponseError);
      expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(`https://servicos.cptec.inpe.br/XML/cidade/${homologated.cptecCode}/dia/2/ondas.xml`);
      await expect(fetchSixDayWaves(homologated)).rejects.toBeInstanceOf(HttpInvalidResponseError);
      expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(`https://servicos.cptec.inpe.br/XML/cidade/${homologated.cptecCode}/todos/tempos/ondas.xml`);
    }
  });

  it('rejects HTTP 200 semantic null and undefined values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(`${header}<cidade><nome>undefined</nome><uf>BA</uf><atualizacao>00/00/0000</atualizacao><previsao><dia>null</dia><tempo>null</tempo><maxima>null</maxima><minima>null</minima><iuv>0</iuv></previsao></cidade>`),
      ),
    );

    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('requires seven unique weather dates and validates the issue date', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(weatherXml({ duplicateDates: true }))));
    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects semantically impossible weather values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(weatherXml({ invalidValues: true }))));
    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('requires exactly one daily wave record for each named period', async () => {
    const period = '<dia>18-08-2026 12h Z</dia><agitacao>Moderado</agitacao><altura>2.3</altura><direcao>SE</direcao><vento>8.7</vento><vento_dir>SE</vento_dir>';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>18-08-2026</atualizacao><manha>${period}</manha><tarde>${period}</tarde></cidade>`),
      ),
    );
    await expect(fetchDailyWaves(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects invalid wave ranges, agitation, and directions', async () => {
    const period = '<dia>18-08-2026 12h Z</dia><agitacao>Calmo</agitacao><altura>-1</altura><direcao>BAD</direcao><vento>-2</vento><vento_dir>BAD</vento_dir>';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>18-08-2026</atualizacao><manha>${period}</manha><tarde>${period.replace('12h', '18h')}</tarde><noite>${period.replace('12h', '21h')}</noite></cidade>`),
      ),
    );
    await expect(fetchDailyWaves(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects duplicate daily wave timestamps', async () => {
    const period = '<dia>18-08-2026 12h Z</dia><agitacao>Moderado</agitacao><altura>2.3</altura><direcao>SE</direcao><vento>8.7</vento><vento_dir>SE</vento_dir>';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(`${header}<cidade><nome>Ilhéus</nome><uf>BA</uf><atualizacao>18-08-2026</atualizacao><manha>${period}</manha><tarde>${period}</tarde><noite>${period}</noite></cidade>`),
      ),
    );
    await expect(fetchDailyWaves(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects DTD and external entity declarations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(`${header}<!DOCTYPE cidade [<!ENTITY xxe SYSTEM "file:///secret">]><cidade></cidade>`),
      ),
    );

    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('rejects a non-XML content type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(`${header}<cidade></cidade>`, 'text/html')));
    await expect(fetchWeather7Days(location)).rejects.toMatchObject({
      name: 'CptecInvalidResponseError',
      stage: 'content_type',
    });
  });

  it('rejects a charset that conflicts with the XML declaration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(weatherXml(), 'text/xml;charset=UTF-8')));
    await expect(fetchWeather7Days(location)).rejects.toMatchObject({
      name: 'CptecInvalidResponseError',
      stage: 'charset',
    });
  });

  it('keeps forecast quality and value invariants discriminated', () => {
    const metadata = {
      source: 'CPTEC/INPE' as const,
      sourceUrl: 'https://servicos.cptec.inpe.br/XML/test',
      issuedAt: null,
      issuedDate: null,
      validAt: null,
      validDate: '2026-08-18',
      fetchedAt: '2026-08-18T00:00:00.000Z',
      coverage: 'município/localidade costeira',
      expiresAt: null,
      stale: false,
    };
    expect(createEstimatedForecast({ date: '2026-08-18' }, metadata).quality).toBe('estimated');
    expect(() => createEstimatedForecast(null, metadata)).toThrow();
    expect(() => createEstimatedForecast({ date: '2026-08-18' }, { ...metadata, validAt: metadata.validDate })).toThrow();
    expect(() => createEstimatedForecast({ date: '2026-08-18' }, {
      ...metadata,
      issuedAt: '2026-08-18T00:00:00.000Z',
      issuedDate: '2026-08-18',
    })).toThrow();
  });

  it('normalizes an aborted request as a timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })),
    );
    await expect(fetchWeather7Days(location)).rejects.toBeInstanceOf(HttpTimeoutError);
  });
});
