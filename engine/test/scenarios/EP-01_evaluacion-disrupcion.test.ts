// Ejecuta brain/features/EP-01_evaluacion-disrupcion.feature: un `it` por escenario, con su mismo nombre.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkInvariants, findPiiKeys } from '../../src/domain/invariants.js';
import { getAssessment, startApp } from '../helpers.js';

const fixture = JSON.parse(
  readFileSync(new URL('../../../brain/contracts/fixtures/disruption_assessment_ABC123.json', import.meta.url), 'utf8'),
);

describe('Característica: Evaluación de la disrupción de una reserva', () => {
  let app: Awaited<ReturnType<typeof startApp>>;
  beforeAll(async () => { app = await startApp(); });
  afterAll(async () => { await app.close(); });

  it('Escenario: Caso base ABC123, retraso con conexión perdida y un menor en el grupo', async () => {
    const { status, headers, body } = await getAssessment(app.base, 'ABC123');
    expect(status).toBe(200);
    expect(body).toEqual(fixture);

    const s1 = body.segments.find((s: any) => s.segment_id === 'S1');
    expect(s1.status).toBe('DELAYED');
    expect(s1.delay_minutes).toBe(160);
    expect(body.data_quality.degraded_events_ignored).toBe(1);
    expect(body.impact.missed_connection).toBe(true);
    expect(body.impact.connection).toMatchObject({ from_segment_id: 'S1', to_segment_id: 'S2' });
    expect(body.entitlements).toContainEqual(expect.objectContaining({ rule_id: 'R3', entitlement: 'REBOOK_NO_FEE', status: 'GRANTED' }));
    expect(body.entitlements).toContainEqual(expect.objectContaining({ rule_id: 'R5', entitlement: 'PRIORITY_HANDLING', status: 'PENDING_APPROVAL' }));
    expect(body.recommended_option.option_id).toBe('O1');
    expect(body.next_step).toBe('ACCEPT_OPTION');
    expect(body.escalations).toContainEqual(expect.objectContaining({ reason: 'APPROVAL_REQUIRED', case_id: 'HC-4471' }));
    expect(JSON.stringify(body)).not.toMatch(/"O2"|"O3"/);
    expect(headers.get('x-simulated-clock')).toBe('2026-09-15T11:02:40Z');
  });

  it('Escenario: DEMOCONF, dos fuentes sanas se contradicen sobre el mismo vuelo', async () => {
    const { status, body } = await getAssessment(app.base, 'DEMOCONF');
    expect(status).toBe(200);
    expect(body.trip_status).toBe('UNVERIFIED');
    expect(body.recommended_option).toBeNull();
    expect(body.next_step).toBe('WAIT_FOR_AGENT');
    expect(body.escalations.map((e: any) => e.reason)).toContain('SOURCE_CONFLICT');
    expect(body.message.params).not.toHaveProperty('new_departure_local');
    expect(body.message.params).not.toHaveProperty('option_flight');
  });

  it('Escenario: DEMONOEV, no hay eventos operacionales para los segmentos', async () => {
    const { status, body } = await getAssessment(app.base, 'DEMONOEV');
    expect(status).toBe(200);
    expect(body.trip_status).toBe('UNVERIFIED');
    expect(body.trip_status).not.toBe('NO_CHANGE');
    expect(body.recommended_option).toBeNull();
    expect(body.next_step).toBe('WAIT_FOR_AGENT');
    expect(body.escalations.map((e: any) => e.reason)).toContain('INCOMPLETE_DATA');
  });

  it('Escenario: Reserva inexistente', async () => {
    const { status, body } = await getAssessment(app.base, 'NOEXISTE');
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'BOOKING_NOT_FOUND' });
  });

  describe('Esquema del escenario: Ninguna respuesta contiene datos personales ni rompe las invariantes', () => {
    it.each(['ABC123', 'DEMOCONF', 'DEMONOEV'])('reserva %s', async (bookingId) => {
      const { body } = await getAssessment(app.base, bookingId);
      expect(findPiiKeys(body)).toEqual([]);
      expect(checkInvariants(body)).toEqual([]);
      expect(body.message.policy_ref).toBeTruthy();
    });
  });
});
