import { addMinutes, minutesBetween } from './time.js';
import type {
  ConsolidatedSegment,
  Consolidation,
  DiscardedEvent,
  EngineConfig,
  OperationalEvent,
  OperationalEvents,
  TripSegment,
} from './types.js';

/**
 * Paso 1 (HU-001): un estado por segmento a partir de eventos de varias fuentes.
 * (a) fuente degradada → descartada; (b) más vieja que max_event_age_minutes → descartada;
 * (c) por tipo gana la más reciente; (d) DELAY y STATUS ON_TIME sanos a la vez → conflicto (UNVERIFIED);
 * (e) segmento sin eventos válidos → UNVERIFIED.
 */
export function consolidate(
  segments: TripSegment[],
  feed: OperationalEvents,
  now: string,
  cfg: EngineConfig,
): Consolidation {
  const degraded = new Set(feed._meta.sources_degraded);
  const used: OperationalEvent[] = [];
  const discarded: DiscardedEvent[] = [];
  const conflictSegments: string[] = [];
  const noDataSegments: string[] = [];
  let conflictsResolved = 0;

  const result = segments.map((seg): ConsolidatedSegment => {
    const all = feed.events.filter((e) => e.segment_id === seg.segment_id);
    const valid: OperationalEvent[] = [];
    const dropped: DiscardedEvent[] = [];

    for (const e of all) {
      if (degraded.has(e.source)) {
        dropped.push({ event_id: e.event_id, segment_id: e.segment_id, source: e.source, reason: 'SOURCE_DEGRADED' });
      } else if (minutesBetween(e.recorded_at, now) > cfg.max_event_age_minutes) {
        dropped.push({ event_id: e.event_id, segment_id: e.segment_id, source: e.source, reason: 'STALE' });
      } else {
        valid.push(e);
      }
    }

    const latestByType = new Map<string, OperationalEvent>();
    for (const e of valid) {
      const prev = latestByType.get(e.type);
      if (!prev || Date.parse(e.recorded_at) > Date.parse(prev.recorded_at)) {
        if (prev) dropped.push({ event_id: prev.event_id, segment_id: prev.segment_id, source: prev.source, reason: 'SUPERSEDED' });
        latestByType.set(e.type, e);
      } else {
        dropped.push({ event_id: e.event_id, segment_id: e.segment_id, source: e.source, reason: 'SUPERSEDED' });
      }
    }
    discarded.push(...dropped);

    const base: ConsolidatedSegment = {
      segment_id: seg.segment_id,
      flight_number: seg.flight_number,
      origin: seg.origin,
      destination: seg.destination,
      date: seg.date,
      status: 'UNVERIFIED',
      scheduled_departure_local: seg.scheduled_departure,
      scheduled_arrival_local: seg.scheduled_arrival,
    };

    const delay = latestByType.get('DELAY');
    const status = latestByType.get('STATUS');
    const gate = latestByType.get('GATE_CHANGE');

    if (delay && status && status.status === 'ON_TIME') {
      conflictSegments.push(seg.segment_id);
      return base;
    }
    if (!delay && !status) {
      noDataSegments.push(seg.segment_id);
      return base;
    }

    const usedHere = [...latestByType.values()];
    used.push(...usedHere);
    if (dropped.some((d) => d.reason !== 'SUPERSEDED' && contradicts(all.find((e) => e.event_id === d.event_id), delay))) {
      conflictsResolved += 1;
    }

    const out: ConsolidatedSegment = { ...base };
    if (delay && delay.delay_minutes !== undefined) {
      out.status = 'DELAYED';
      out.new_departure_local = delay.new_departure ?? addMinutes(seg.scheduled_departure, delay.delay_minutes);
      out.delay_minutes = delay.delay_minutes;
      out.estimated_arrival_local = addMinutes(seg.scheduled_arrival, delay.delay_minutes);
    } else {
      out.status = status?.status === 'ON_TIME' ? 'ON_TIME' : 'SCHEDULED';
    }
    if (gate?.gate) out.gate = gate.gate;
    out.data_as_of = usedHere
      .map((e) => e.recorded_at)
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
    return reorder(out);
  });

  return {
    segments: result,
    events_used: used,
    events_discarded: discarded,
    conflict_segments: conflictSegments,
    no_data_segments: noDataSegments,
    conflicts_resolved: conflictsResolved,
  };
}

function contradicts(dropped: OperationalEvent | undefined, delay: OperationalEvent | undefined): boolean {
  return !!dropped && !!delay && dropped.type === 'STATUS' && dropped.status === 'ON_TIME';
}

function reorder(s: ConsolidatedSegment): ConsolidatedSegment {
  const keys: (keyof ConsolidatedSegment)[] = [
    'segment_id', 'flight_number', 'origin', 'destination', 'date', 'status',
    'scheduled_departure_local', 'new_departure_local', 'delay_minutes',
    'scheduled_arrival_local', 'estimated_arrival_local', 'gate', 'data_as_of',
  ];
  const out: Record<string, unknown> = {};
  for (const k of keys) if (s[k] !== undefined) out[k] = s[k];
  return out as unknown as ConsolidatedSegment;
}
