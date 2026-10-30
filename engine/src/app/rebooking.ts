import { createHash } from 'node:crypto';
import { readAndEvaluate, type Deps } from './orchestrator.js';

export const MAX_RETRIES = 2;

export type RebookingOutcome =
  | { status: 201 | 200; body: { request_id: string; status: string; expires_at: string } }
  | { status: 202; body: { status: 'CONFIRMING' } }
  | { status: 410; body: { error: 'OPTION_EXPIRED' } }
  | { status: 422; body: { error: 'OPTION_NOT_RECOMMENDED' } };

/** Determinística: la misma reserva, opción, versión de política y cantidad de pasajeros dan la misma clave. */
export function idempotencyKey(bookingId: string, optionId: string, policyRef: string, passengerCount: number): string {
  return createHash('sha256').update([bookingId, optionId, policyRef, passengerCount].join('|')).digest('hex');
}

/**
 * HU-007. Vuelve a evaluar la reserva y no confía en lo que mostró la pantalla: sólo se solicita la opción
 * recomendada ahora, vigente y cubierta por un entitlement REBOOK_NO_FEE otorgado (P-17: R5 no lo impide).
 * Ante un fallo de la tool se reintenta con la misma clave; si sigue indeterminado, se deriva.
 */
export async function requestRebooking(
  bookingId: string,
  optionId: string,
  deps: Deps,
): Promise<RebookingOutcome> {
  const ev = await readAndEvaluate(bookingId, deps);

  const evaluated = ev.options_evaluated.find((o) => o.option_id === optionId);
  if (evaluated?.reasons.includes('EXPIRED')) return { status: 410, body: { error: 'OPTION_EXPIRED' } };

  const covered = ev.entitlements.some((e) => e.entitlement === 'REBOOK_NO_FEE' && e.status === 'GRANTED');
  if (!ev.recommended || ev.recommended.option_id !== optionId || !covered) {
    return { status: 422, body: { error: 'OPTION_NOT_RECOMMENDED' } };
  }

  const key = idempotencyKey(bookingId, optionId, ev.input.policy.version, ev.group.passenger_count);
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await deps.tools.create_rebooking_request(bookingId, optionId, key);
      return {
        status: r.duplicate ? 200 : 201,
        body: { request_id: r.request_id, status: r.status, expires_at: r.expires_at },
      };
    } catch {
      // 503 UPSTREAM_TIMEOUT es indeterminado: se reintenta con la MISMA clave, nunca con una nueva.
    }
  }
  try {
    await deps.tools.create_human_case({
      booking_id: bookingId,
      reason: 'REBOOKING_INDETERMINATE',
      decision_id: ev.input.decision_id,
    });
  } catch {
    // Si tampoco se puede derivar, igual se le dice al pasajero que se está confirmando.
  }
  return { status: 202, body: { status: 'CONFIRMING' } };
}
