// Parte backend de brain/features/EP-01_pantalla-pasajero.feature (HU-007 y HU-008).
// Los escenarios de la pantalla (HU-010 y la interacción de HU-007) se ejecutan en web/test/.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MockState, MockTools, fixedClock } from '../../src/adapters/mock/mockTools.js';
import { SCENARIOS } from '../../src/adapters/mock/scenarios.js';
import { assessDisruption } from '../../src/app/orchestrator.js';
import { idempotencyKey, requestRebooking } from '../../src/app/rebooking.js';
import { createApp } from '../../src/http/server.js';
import { DEFAULT_CONFIG } from '../../src/domain/types.js';

const abc = SCENARIOS.get('ABC123')!;
const depsAt = (tools: MockTools, clock = abc.clock) => ({
  tools,
  clock: fixedClock(clock),
  cfg: DEFAULT_CONFIG,
  decisionId: () => abc.decision_id,
});
const post = (base: string, id: string, body: unknown) =>
  fetch(`${base}/v1/bookings/${id}/rebooking-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('Característica: Pantalla del pasajero ante una modificación de vuelo (backend)', () => {
  let base: string;
  let server: ReturnType<typeof createApp>;
  const staticDir = mkdtempSync(join(tmpdir(), 'dc-web-'));
  writeFileSync(join(staticDir, 'index.html'), '<!doctype html><title>pantalla</title>');

  beforeAll(async () => {
    server = createApp(undefined, () => {}, { staticDir });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => { await new Promise((r) => server.close(r)); });

  it('Escenario: Confirmar crea una solicitud pendiente, nunca confirmada', async () => {
    const res = await post(base, 'ABC123', { decision_id: abc.decision_id, option_id: 'O1' });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ request_id: 'RBK-88231', status: 'PENDING_CONFIRMATION', expires_at: '2026-09-15T11:12:00Z' });
  });

  it('Escenario: Aceptar dos veces crea una sola solicitud', async () => {
    const tools = new MockTools(abc, new MockState());
    const first = await requestRebooking('ABC123', 'O1', depsAt(tools));
    const second = await requestRebooking('ABC123', 'O1', depsAt(tools));
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect((second.body as { request_id: string }).request_id).toBe('RBK-88231');
    expect(tools.writes.filter((w) => w.tool === 'create_rebooking_request')).toHaveLength(1);
  });

  it('Escenario: Una opción que no es la recomendada se rechaza', async () => {
    const tools = new MockTools(abc);
    const out = await requestRebooking('ABC123', 'O2', depsAt(tools));
    expect(out).toEqual({ status: 422, body: { error: 'OPTION_NOT_RECOMMENDED' } });
    expect(tools.writes.filter((w) => w.tool === 'create_rebooking_request')).toHaveLength(0);
  });

  it('Escenario: Solicitar una opción vencida se rechaza', async () => {
    const tools = new MockTools(abc);
    const out = await requestRebooking('ABC123', 'O1', depsAt(tools, '2026-09-15T11:05:00Z'));
    expect(out).toEqual({ status: 410, body: { error: 'OPTION_EXPIRED' } });
    expect(tools.writes.filter((w) => w.tool === 'create_rebooking_request')).toHaveLength(0);
  });

  it('Escenario: La clave de idempotencia es determinística', () => {
    const pax = ['P1', 'P2'];
    const k = idempotencyKey('ABC123', 'O1', 'POL-DELAY-2026-03', pax);
    expect(idempotencyKey('ABC123', 'O1', 'POL-DELAY-2026-03', pax)).toBe(k);
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    for (const other of [
      idempotencyKey('XYZ789', 'O1', 'POL-DELAY-2026-03', pax),
      idempotencyKey('ABC123', 'O2', 'POL-DELAY-2026-03', pax),
      idempotencyKey('ABC123', 'O1', 'POL-DELAY-2026-04', pax),
      idempotencyKey('ABC123', 'O1', 'POL-DELAY-2026-03', ['P1', 'P3']),
    ]) expect(other).not.toBe(k);
  });

  it('Escenario: Refrescar la pantalla no repite escrituras', async () => {
    const state = new MockState();
    const tools = new MockTools(abc, state);
    const first = await assessDisruption('ABC123', depsAt(tools));
    const second = await assessDisruption('ABC123', depsAt(tools));
    expect(state.writes.filter((w) => w.tool === 'create_human_case')).toHaveLength(1);
    expect(state.writes.filter((w) => w.tool === 'notify_passenger')).toHaveLength(1);
    expect(second.assessment.escalations[0]!.case_id).toBe('HC-4471');
    expect(second.assessment).toEqual(first.assessment);
  });

  describe('HU-007: errores y reintentos', () => {
    it('503 de la tool: reintenta con la MISMA clave hasta 2 veces y luego deriva (202)', async () => {
      const tools = new MockTools(abc);
      const keys: string[] = [];
      tools.create_rebooking_request = async (_b, _o, key) => { keys.push(key); throw new Error('503'); };
      const out = await requestRebooking('ABC123', 'O1', depsAt(tools));
      expect(out).toEqual({ status: 202, body: { status: 'CONFIRMING' } });
      expect(keys).toHaveLength(3);
      expect(new Set(keys).size).toBe(1);
      expect(tools.writes.map((w) => (w.input as { reason?: string }).reason)).toContain('REBOOKING_INDETERMINATE');
    });

    it('un 503 seguido de éxito no crea una segunda solicitud', async () => {
      const tools = new MockTools(abc);
      const real = tools.create_rebooking_request.bind(tools);
      let calls = 0;
      tools.create_rebooking_request = async (b, o, k) => { if (calls++ === 0) throw new Error('503'); return real(b, o, k); };
      const out = await requestRebooking('ABC123', 'O1', depsAt(tools));
      expect(out.status).toBe(201);
      expect(tools.writes.filter((w) => w.tool === 'create_rebooking_request')).toHaveLength(1);
    });

    it('cuerpo inválido → 400, reserva inexistente → 404, método incorrecto → 405', async () => {
      expect((await post(base, 'ABC123', 'no es json')).status).toBe(400);
      expect((await post(base, 'ABC123', { option_id: 'O1' })).status).toBe(400);
      expect((await post(base, 'NOEXISTE', { decision_id: 'd', option_id: 'O1' })).status).toBe(404);
      expect((await fetch(`${base}/v1/bookings/ABC123/rebooking-requests`)).status).toBe(405);
    });
  });

  describe('Pantalla estática', () => {
    it('sirve index.html en / y no deja salir del directorio', async () => {
      const res = await fetch(`${base}/`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      expect(await res.text()).toContain('pantalla');
      for (const p of ['/..%2f..%2fpackage.json', '/%2e%2e/%2e%2e/package.json', '/no-existe.js']) {
        expect((await fetch(`${base}${p}`)).status, p).toBe(404);
      }
    });
  });
});
