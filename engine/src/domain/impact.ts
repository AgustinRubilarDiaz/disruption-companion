import { localStamp } from './time.js';
import type { ConsolidatedSegment, EngineConfig, Impact } from './types.js';

/** Paso 2 (HU-002): compara la llegada estimada de cada segmento con la salida del siguiente + MCT. */
export function computeImpact(segments: ConsolidatedSegment[], cfg: EngineConfig): Impact {
  for (let i = 0; i < segments.length - 1; i++) {
    const from = segments[i]!;
    const to = segments[i + 1]!;
    if (from.status === 'UNVERIFIED' || to.status === 'UNVERIFIED') continue;

    const arrival =
      localStamp(from.date, from.scheduled_arrival_local) + (from.delay_minutes ?? 0);
    const departure = localStamp(to.date, to.new_departure_local ?? to.scheduled_departure_local);

    if (arrival + cfg.mct_minutes > departure) {
      return {
        missed_connection: true,
        connection: {
          from_segment_id: from.segment_id,
          to_segment_id: to.segment_id,
          estimated_arrival_local: from.estimated_arrival_local ?? from.scheduled_arrival_local,
          next_departure_local: to.new_departure_local ?? to.scheduled_departure_local,
          mct_minutes: cfg.mct_minutes,
        },
        delay_basis: 'PER_SEGMENT',
      };
    }
  }
  return { missed_connection: false, delay_basis: 'PER_SEGMENT' };
}
