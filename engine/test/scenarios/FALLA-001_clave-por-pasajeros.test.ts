// brain/features/FALLA-001_clave-por-pasajeros.feature (RN-03, ADR-006).
import { describe, expect, it } from 'vitest';
import { MockTools, fixedClock } from '../../src/adapters/mock/mockTools.js';
import { SCENARIOS } from '../../src/adapters/mock/scenarios.js';
import { idempotencyKey, requestRebooking } from '../../src/app/rebooking.js';
import { DEFAULT_CONFIG } from '../../src/domain/types.js';

const abc = SCENARIOS.get('ABC123')!;
const deps = (tools: MockTools) => ({
  tools,
  clock: fixedClock(abc.clock),
  cfg: DEFAULT_CONFIG,
  decisionId: () => abc.decision_id,
});
const POLICY = 'POL-DELAY-2026-03';

describe('Característica: La clave de idempotencia identifica la intención, incluidos los pasajeros', () => {
  it('Escenario: Dos grupos del mismo tamaño en la misma reserva tienen claves distintas', () => {
    expect(idempotencyKey('ABC123', 'O1', POLICY, ['P1', 'P2'])).not.toBe(idempotencyKey('ABC123', 'O1', POLICY, ['P1', 'P3']));
  });

  it('Escenario: El orden de los pasajeros no cambia la clave', () => {
    expect(idempotencyKey('ABC123', 'O1', POLICY, ['P2', 'P1'])).toBe(idempotencyKey('ABC123', 'O1', POLICY, ['P1', 'P2']));
  });

  describe('Esquema del escenario: La clave cambia si cambia cualquier parte de la intención', () => {
    const base = idempotencyKey('ABC123', 'O1', POLICY, ['P1', 'P2']);
    it.each([
      ['la reserva', idempotencyKey('XYZ789', 'O1', POLICY, ['P1', 'P2'])],
      ['la opción', idempotencyKey('ABC123', 'O2', POLICY, ['P1', 'P2'])],
      ['la política', idempotencyKey('ABC123', 'O1', 'POL-DELAY-2026-04', ['P1', 'P2'])],
      ['los pasajeros', idempotencyKey('ABC123', 'O1', POLICY, ['P1'])],
    ])('cambiando %s', (_parte, other) => {
      expect(other).not.toBe(base);
    });
  });

  it('Escenario: La solicitud del caso base usa la clave de sus pasajeros', async () => {
    const tools = new MockTools(abc);
    const keys: string[] = [];
    const real = tools.create_rebooking_request.bind(tools);
    tools.create_rebooking_request = async (b, o, k) => { keys.push(k); return real(b, o, k); };
    const out = await requestRebooking('ABC123', 'O1', deps(tools));
    expect(out.status).toBe(201);
    expect(keys).toEqual([idempotencyKey('ABC123', 'O1', POLICY, ['P1', 'P2'])]);
  });

  it('Escenario: Los reintentos ante un 503 siguen usando la misma clave', async () => {
    const tools = new MockTools(abc);
    const keys: string[] = [];
    tools.create_rebooking_request = async (_b, _o, k) => { keys.push(k); throw new Error('503 UPSTREAM_TIMEOUT'); };
    const out = await requestRebooking('ABC123', 'O1', deps(tools));
    expect(out).toEqual({ status: 202, body: { status: 'CONFIRMING' } });
    expect(keys).toEqual(Array(3).fill(idempotencyKey('ABC123', 'O1', POLICY, ['P1', 'P2'])));
    expect(tools.writes.map((w) => (w.input as { reason?: string }).reason)).toContain('REBOOKING_INDETERMINATE');
  });
});
