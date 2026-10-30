import { describe, expect, it } from 'vitest';
import { MockTools, fixedClock } from '../../src/adapters/mock/mockTools.js';
import { SCENARIOS } from '../../src/adapters/mock/scenarios.js';
import { assessDisruption } from '../../src/app/orchestrator.js';
import { checkInvariants, findPiiKeys } from '../../src/domain/invariants.js';
import { DEFAULT_CONFIG } from '../../src/domain/types.js';

const abc = SCENARIOS.get('ABC123')!;
const run = (tools: MockTools) =>
  assessDisruption('ABC123', { tools, clock: fixedClock(abc.clock), cfg: DEFAULT_CONFIG, decisionId: () => abc.decision_id });

describe('assessDisruption', () => {
  it('crea un caso por R5, notifica con policy_ref y no crea una solicitud de cambio (la acepta el pasajero)', async () => {
    const tools = new MockTools(abc);
    const { record } = await run(tools);
    expect(tools.writes.map((w) => w.tool)).toEqual(['create_human_case', 'notify_passenger']);
    expect(record.notification_id).toBe('NT-9912');
    expect(record.request_id).toBeNull();
  });

  it('el registro de decisiones no contiene datos personales y conserva los descartes', async () => {
    const { record } = await run(new MockTools(abc));
    expect(findPiiKeys(record)).toEqual([]);
    expect(JSON.stringify(record)).not.toContain('ABC123');
    expect(record.options_evaluated.map((o) => o.result)).toEqual(['RECOMMENDED', 'DISCARDED', 'DISCARDED']);
  });

  it('si create_human_case falla, la derivación queda CREATION_FAILED y el mensaje no menciona un caso', async () => {
    const tools = new MockTools(abc);
    tools.create_human_case = async () => { throw new Error('503'); };
    const { assessment } = await run(tools);
    expect(assessment.escalations[0]!.status).toBe('CREATION_FAILED');
    expect(assessment.message.params).not.toHaveProperty('priority_handling_sla_minutes');
    expect(checkInvariants(assessment)).toEqual([]);
  });

  it('si get_operational_events falla → UNVERIFIED + READ_FAILURE, nunca un 5xx', async () => {
    const tools = new MockTools(abc);
    tools.get_operational_events = async () => { throw new Error('timeout'); };
    const { assessment } = await run(tools);
    expect(assessment.trip_status).toBe('UNVERIFIED');
    expect(assessment.escalations.map((e) => e.reason)).toEqual(['READ_FAILURE']);
    expect(checkInvariants(assessment)).toEqual([]);
  });
});
