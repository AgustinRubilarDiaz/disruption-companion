import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../src/adapters/mock/scenarios.js';
import { groupOf } from '../../src/domain/assess.js';
import { consolidate } from '../../src/domain/consolidate.js';
import { decideControl, tripStatus } from '../../src/domain/control.js';
import { computeImpact } from '../../src/domain/impact.js';
import { MessageValidationError, buildMessage } from '../../src/domain/message.js';
import { filterOptions } from '../../src/domain/options.js';
import { deriveFacts, evaluatePolicy } from '../../src/domain/policy.js';
import { addMinutes } from '../../src/domain/time.js';
import { DEFAULT_CONFIG, type Entitlement, type PolicyRules } from '../../src/domain/types.js';

const abc = SCENARIOS.get('ABC123')!;
const NOW = abc.clock;

function consolidated() {
  return consolidate(abc.trip.segments, abc.events, NOW, DEFAULT_CONFIG);
}

describe('time', () => {
  it('suma minutos y cruza medianoche', () => {
    expect(addMinutes('17:55', 160)).toBe('20:35');
    expect(addMinutes('23:40', 30)).toBe('00:10');
  });
});

describe('consolidate (HU-001)', () => {
  it('descarta la fuente degradada y resuelve S1 como DELAYED con data_as_of del evento más antiguo', () => {
    const c = consolidated();
    const s1 = c.segments[0]!;
    expect(s1).toMatchObject({ status: 'DELAYED', delay_minutes: 160, new_departure_local: '17:10', estimated_arrival_local: '20:35', gate: '24' });
    expect(s1.data_as_of).toBe('2026-09-15T10:48:00Z');
    expect(c.events_discarded).toEqual([{ event_id: 'E-1012', segment_id: 'S1', source: 'LEGACY_MIRROR', reason: 'SOURCE_DEGRADED' }]);
    expect(c.conflicts_resolved).toBe(1);
  });

  it('descarta un evento más viejo que max_event_age_minutes', () => {
    const events = structuredClone(abc.events);
    events._meta.sources_degraded = [];
    events.events = events.events.filter((e) => e.event_id === 'E-1012');
    const c = consolidate(abc.trip.segments, events, NOW, DEFAULT_CONFIG);
    expect(c.events_discarded[0]?.reason).toBe('STALE');
    expect(c.segments[0]!.status).toBe('UNVERIFIED');
  });

  it('dos fuentes sanas incompatibles dejan el segmento UNVERIFIED', () => {
    const conf = SCENARIOS.get('DEMOCONF')!;
    const c = consolidate(conf.trip.segments, conf.events, NOW, DEFAULT_CONFIG);
    expect(c.segments[0]!.status).toBe('UNVERIFIED');
    expect(c.conflict_segments).toEqual(['S1']);
  });
});

describe('computeImpact (HU-002)', () => {
  it('llegada 20:35 contra salida 19:05 → conexión perdida', () => {
    const impact = computeImpact(consolidated().segments, DEFAULT_CONFIG);
    expect(impact.missed_connection).toBe(true);
    expect(impact.connection).toMatchObject({ estimated_arrival_local: '20:35', next_departure_local: '19:05', mct_minutes: 0 });
  });

  it('el MCT configurable puede convertir una conexión ajustada en perdida', () => {
    const segs = consolidated().segments.map((s) => ({ ...s, delay_minutes: undefined, status: 'ON_TIME' as const }));
    expect(computeImpact(segs, DEFAULT_CONFIG).missed_connection).toBe(false);
    expect(computeImpact(segs, { ...DEFAULT_CONFIG, mct_minutes: 90 }).missed_connection).toBe(true);
  });
});

describe('evaluatePolicy (HU-003)', () => {
  const facts = () => deriveFacts(consolidated().segments, computeImpact(consolidated().segments, DEFAULT_CONFIG), groupOf(abc.trip));

  it('R3 se otorga y R5 queda pendiente de aprobación; R1, R2 y R4 no aplican', () => {
    const { evaluations, entitlements } = evaluatePolicy(abc.policy, facts());
    expect(evaluations.filter((e) => e.applies).map((e) => e.rule_id)).toEqual(['R3', 'R5']);
    expect(entitlements).toEqual([
      { entitlement: 'REBOOK_NO_FEE', policy_ref: 'POL-DELAY-2026-03', rule_id: 'R3', requires_human_approval: false, status: 'GRANTED' },
      { entitlement: 'PRIORITY_HANDLING', policy_ref: 'POL-DELAY-2026-03', rule_id: 'R5', requires_human_approval: true, status: 'PENDING_APPROVAL' },
    ]);
  });

  it('SCL→LIM→MEX es internacional', () => {
    expect(facts().international).toBe(true);
  });

  it('una condición que no entiende queda como regla no soportada', () => {
    const policy: PolicyRules = structuredClone(abc.policy);
    policy.rules.push({ rule_id: 'R6', condition: 'weather_category IN (A,B)', entitlement: 'HOTEL', requires_human_approval: false });
    const r6 = evaluatePolicy(policy, facts()).evaluations.find((e) => e.rule_id === 'R6')!;
    expect(r6).toMatchObject({ supported: false, applies: false });
  });
});

describe('filterOptions (HU-004)', () => {
  const granted: Entitlement[] = [
    { entitlement: 'REBOOK_NO_FEE', policy_ref: 'POL-DELAY-2026-03', rule_id: 'R3', requires_human_approval: false, status: 'GRANTED' },
  ];

  it('recomienda O1 y descarta O2 y O3 con sus motivos', () => {
    const { evaluations, recommended } = filterOptions(abc.options, granted, groupOf(abc.trip), abc.trip.fare_conditions, 'POL-DELAY-2026-03', NOW);
    expect(recommended).toMatchObject({ option_id: 'O1', covers_passengers: 2, valid_until: '2026-09-15T11:04:35Z' });
    expect(evaluations.find((e) => e.option_id === 'O2')!.reasons).toEqual(['SEATS_INSUFFICIENT', 'FARE_DIFFERENCE_CONFLICTS_ENTITLEMENT']);
    expect(evaluations.find((e) => e.option_id === 'O3')!.reasons).toEqual(['NON_REFUNDABLE_FARE', 'POLICY_NOT_AVAILABLE', 'LOW_CONFIDENCE']);
  });

  it('opciones vencidas → ninguna recomendada, motivo EXPIRED', () => {
    const { evaluations, recommended } = filterOptions(abc.options, granted, groupOf(abc.trip), abc.trip.fare_conditions, 'POL-DELAY-2026-03', '2026-09-15T11:05:00Z');
    expect(recommended).toBeNull();
    expect(evaluations.every((e) => e.reasons.includes('EXPIRED'))).toBe(true);
  });
});

describe('decideControl (HU-005)', () => {
  it('hay opción → ACCEPT_OPTION y una derivación APPROVAL_REQUIRED por R5 en paralelo (P-17)', () => {
    const c = consolidated();
    const impact = computeImpact(c.segments, DEFAULT_CONFIG);
    const { evaluations, entitlements } = evaluatePolicy(abc.policy, deriveFacts(c.segments, impact, groupOf(abc.trip)));
    const { recommended } = filterOptions(abc.options, entitlements, groupOf(abc.trip), abc.trip.fare_conditions, abc.policy.version, NOW);
    const out = decideControl({ status: tripStatus(c, impact, entitlements), consolidation: c, entitlements, evaluations, recommended, policyRef: abc.policy.version, readFailure: false });
    expect(out.next_step).toBe('ACCEPT_OPTION');
    expect(out.escalations).toEqual([{ reason: 'APPROVAL_REQUIRED', policy_ref: 'POL-DELAY-2026-03', rule_id: 'R5' }]);
  });

  it('cambio de pasaje otorgado sin opción viable → WAIT_FOR_AGENT + NO_VIABLE_OPTION', () => {
    const c = consolidated();
    const entitlements: Entitlement[] = [
      { entitlement: 'REBOOK_NO_FEE', policy_ref: 'POL-DELAY-2026-03', rule_id: 'R3', requires_human_approval: false, status: 'GRANTED' },
    ];
    const out = decideControl({ status: 'RELEVANT_CHANGE', consolidation: c, entitlements, evaluations: [], recommended: null, policyRef: 'POL-DELAY-2026-03', readFailure: false });
    expect(out.next_step).toBe('WAIT_FOR_AGENT');
    expect(out.escalations.map((e) => e.reason)).toEqual(['NO_VIABLE_OPTION']);
  });

  it('falla de lectura → WAIT_FOR_AGENT + READ_FAILURE', () => {
    const out = decideControl({ status: 'UNVERIFIED', consolidation: consolidated(), entitlements: [], evaluations: [], recommended: null, policyRef: 'POL-DELAY-2026-03', readFailure: true });
    expect(out).toEqual({ next_step: 'WAIT_FOR_AGENT', escalations: [{ reason: 'READ_FAILURE' }] });
  });
});

describe('buildMessage (HU-006)', () => {
  it('sin policy_ref no se construye', () => {
    expect(() => buildMessage({} as never, undefined)).toThrow(MessageValidationError);
  });
});
