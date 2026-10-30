// Las horas `_local` no traen zona horaria (P-07): se operan como minutos dentro de la fecha del segmento.

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function fromMinutes(total: number): string {
  const inDay = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(inDay / 60);
  const m = inDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutes(hhmm: string, minutes: number): string {
  return fromMinutes(toMinutes(hhmm) + minutes);
}

/** Minutos absolutos de una fecha + hora local, para comparar horas de segmentos distintos. */
export function localStamp(date: string, hhmm: string, dayOffset = 0): number {
  const days = Date.parse(`${date}T00:00:00Z`) / 60_000;
  return days + dayOffset * 1440 + toMinutes(hhmm);
}

export function minutesBetween(fromIso: string, toIso: string): number {
  return (Date.parse(toIso) - Date.parse(fromIso)) / 60_000;
}

export function addSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString().replace('.000Z', 'Z');
}
