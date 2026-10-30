import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { findPiiKeys } from '../../src/domain/invariants.js';
import { getAssessment, startApp } from '../helpers.js';

const BRAIN = new URL('../../../brain/contracts/fixtures/', import.meta.url);
const ENGINE = new URL('../../fixtures/', import.meta.url);

describe('Contrato', () => {
  it('los fixtures del motor son copia exacta de los del contrato', () => {
    for (const file of readdirSync(BRAIN).filter((f) => f.endsWith('.json'))) {
      expect(readFileSync(new URL(file, ENGINE), 'utf8'), file).toBe(readFileSync(new URL(file, BRAIN), 'utf8'));
    }
  });

  describe('HTTP', () => {
    let app: Awaited<ReturnType<typeof startApp>>;
    beforeAll(async () => { app = await startApp(); });
    afterAll(async () => { await app.close(); });

    it.each(['ABC123', 'DEMOCONF', 'DEMONOEV'])(
      'los fixtures de la pantalla (web/test/fixtures) son idénticos a lo que devuelve la API: %s',
      async (id) => {
        const file = new URL(`../../../web/test/fixtures/assessment_${id}.json`, import.meta.url);
        const { body } = await getAssessment(app.base, id);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(body);
      },
    );

    it('booking_id con formato inválido → 400', async () => {
      const { status, body } = await getAssessment(app.base, 'abc-123');
      expect(status).toBe(400);
      expect(body).toEqual({ error: 'INVALID_BOOKING_ID' });
    });

    it('GET /health', async () => {
      const res = await fetch(`${app.base}/health`);
      expect(res.status).toBe(200);
    });

    it('GET /v1/scenarios lista las reservas de demostración sin datos personales', async () => {
      const body = await (await fetch(`${app.base}/v1/scenarios`)).json();
      expect(body.scenarios.map((s: any) => s.booking_id)).toEqual(['ABC123', 'DEMOCONF', 'DEMONOEV']);
      expect(findPiiKeys(body)).toEqual([]);
    });
  });
});
