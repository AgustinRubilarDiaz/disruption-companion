import { GENERIC, HERO, SEGMENT_STATUS, TEMPLATES, TEXT, type Ctx, type Kind, type Tone } from './copy';
import type { Assessment, Segment } from './types';

export interface Leg {
  segmentId: string;
  flight: string;
  from: string;
  to: string;
  date: string;
  status: 'DELAYED' | 'ON_TIME' | 'SCHEDULED' | 'UNVERIFIED';
  statusLabel: string;
  scheduledDeparture?: string;
  /** Sólo en un tramo confirmado con cambio de hora. */
  newDeparture?: string;
  delayLabel?: string;
  gate?: string;
}

export interface FlightSlot {
  flight: string;
  date: string;
  time: string;
}

export interface ViewModel {
  kind: Kind;
  hero: { title: string; tone: Tone };
  alert: string;
  impact?: string;
  next: string;
  notice?: string;
  reference?: string;
  dataAsOf?: string;
  /** Tramos en orden; `missedAfter` marca la conexión perdida después de ese tramo. */
  itinerary: { legs: Leg[]; missedAfter?: string };
  compare?: { before: FlightSlot; after: FlightSlot };
  option?: { optionId: string; confirmText: string; validForSeconds: number };
  /** Sólo con next_step = ACCEPT_OPTION, una opción y una plantilla conocida de oferta. */
  canAccept: boolean;
}

/** Función pura: lee el contrato y arma lo que se muestra. No calcula entitlements, elegibilidad ni conexiones. */
export function toViewModel(a: Assessment): ViewModel {
  const sections = TEMPLATES[a.message.template_id] ?? GENERIC;
  const ctx: Ctx = { ...a.message.params, connection_departure: a.impact?.connection?.next_departure_local };

  const created = a.escalations.find((e) => e.status === 'CREATED' && e.case_id);
  const dataAsOf = a.segments
    .map((s) => s.data_as_of)
    .filter((d): d is string => !!d)
    .sort()[0];
  const opt = a.recommended_option;
  const canAccept = a.next_step === 'ACCEPT_OPTION' && opt !== null && sections.kind === 'REBOOK_OFFER';

  return {
    kind: sections.kind,
    hero: HERO[sections.kind],
    alert: sections.alert(ctx),
    impact: sections.impact?.(ctx),
    next: sections.next(ctx),
    notice: sections.notice?.(ctx),
    reference: created?.case_id ? TEXT.reference(created.case_id) : undefined,
    dataAsOf: dataAsOf ? TEXT.dataAsOf(dataAsOf.slice(11, 16)) : undefined,
    itinerary: itinerary(a),
    compare: canAccept ? compare(a) : undefined,
    option: canAccept && opt
      ? {
          optionId: opt.option_id,
          confirmText: TEXT.confirmAsk(ctx),
          validForSeconds: Math.max(0, Math.round((Date.parse(opt.valid_until) - Date.parse(a.evaluated_at)) / 1000)),
        }
      : undefined,
    canAccept,
  };
}

function leg(s: Segment): Leg {
  const status = (['DELAYED', 'ON_TIME', 'SCHEDULED'] as const).find((x) => x === s.status) ?? 'UNVERIFIED';
  const base: Leg = {
    segmentId: s.segment_id,
    flight: s.flight_number ?? '',
    from: s.origin ?? '',
    to: s.destination ?? '',
    date: s.date ?? '',
    status,
    statusLabel: SEGMENT_STATUS[status]!,
    scheduledDeparture: s.scheduled_departure_local,
  };
  // Un tramo sin confirmar sólo muestra lo programado: nunca una hora nueva ni un retraso.
  if (status === 'UNVERIFIED') return base;
  return {
    ...base,
    newDeparture: s.new_departure_local !== s.scheduled_departure_local ? s.new_departure_local : undefined,
    delayLabel: s.delay_minutes ? `+${s.delay_minutes} min` : undefined,
    gate: s.gate,
  };
}

function itinerary(a: Assessment): ViewModel['itinerary'] {
  const legs = a.segments.map(leg);
  const c = a.impact?.connection;
  const missedAfter =
    a.impact?.missed_connection && c?.from_segment_id && legs.some((l) => l.segmentId === c.from_segment_id)
      ? c.from_segment_id
      : undefined;
  return { legs, missedAfter };
}

function compare(a: Assessment): ViewModel['compare'] {
  const to = a.segments.find((s) => s.segment_id === a.impact?.connection?.to_segment_id);
  const o = a.recommended_option;
  if (!to || !o?.flight_number || !o.date || !o.departure_local) return undefined;
  return {
    before: { flight: to.flight_number ?? '', date: to.date ?? '', time: to.new_departure_local ?? to.scheduled_departure_local ?? '' },
    after: { flight: o.flight_number, date: o.date, time: o.departure_local },
  };
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
