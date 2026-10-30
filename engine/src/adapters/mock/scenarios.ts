import { readFileSync } from 'node:fs';
import type {
  EligibleOptions,
  HumanCase,
  Notification,
  OperationalEvents,
  PolicyRules,
  TripContext,
} from '../../domain/types.js';

const FIXTURES = new URL('../../../fixtures/', import.meta.url);

function load<T>(file: string): T {
  return JSON.parse(readFileSync(new URL(file, FIXTURES), 'utf8')) as T;
}

/** Datos de una reserva de demostración. Los del caso base son los del enunciado, sin cambios. */
export interface Scenario {
  booking_id: string;
  description: string;
  clock: string;
  decision_id: string;
  trip: TripContext;
  events: OperationalEvents;
  options: EligibleOptions;
  policy: PolicyRules;
  human_case: HumanCase;
  notification: Notification;
  rebooking: { request_id: string; status: string; expires_at: string };
}

const trip = load<TripContext>('get_trip_context_ABC123.json');
const events = load<OperationalEvents>('get_operational_events_S1_S2.json');
const options = load<EligibleOptions>('get_eligible_options.json');
const policy = load<PolicyRules>('get_policy_rules_DELAY.json');
const writes = load<{
  create_rebooking_request: { '201': Scenario['rebooking'] };
  create_human_case: { '201': HumanCase };
  notify_passenger: { '202': Notification };
}>('write_tools_responses.json');

const CLOCK = '2026-09-15T11:02:40Z';

function base(booking_id: string, decision_id: string, description: string): Scenario {
  return {
    booking_id,
    description,
    clock: CLOCK,
    decision_id,
    trip: { ...structuredClone(trip), booking_id },
    events: structuredClone(events),
    options: structuredClone(options),
    policy: structuredClone(policy),
    human_case: writes.create_human_case['201'],
    notification: writes.notify_passenger['202'],
    rebooking: writes.create_rebooking_request['201'],
  };
}

const abc = base('ABC123', 'dec_01JB7Q3M8K2V', 'Caso base del enunciado: retraso de 160 min, conexión perdida, grupo con un menor');

const conf = base('DEMOCONF', 'dec_01JB7Q3M8K3C', 'Dos fuentes sanas se contradicen sobre S1');
conf.events = {
  events: [
    { event_id: 'E-1001', segment_id: 'S1', type: 'DELAY', new_departure: '17:10', delay_minutes: 160, source: 'OPS_CORE', recorded_at: '2026-09-15T10:48:00Z' },
    { event_id: 'E-3001', segment_id: 'S1', type: 'STATUS', status: 'ON_TIME', source: 'AIRPORT_FEED', recorded_at: '2026-09-15T10:58:00Z' },
    { event_id: 'E-2003', segment_id: 'S2', type: 'STATUS', status: 'SCHEDULED', source: 'OPS_CORE', recorded_at: '2026-09-15T10:48:00Z' },
  ],
  _meta: { retrieved_at: '2026-09-15T11:02:33Z', sources_available: ['OPS_CORE', 'AIRPORT_FEED'], sources_degraded: [] },
};

const noev = base('DEMONOEV', 'dec_01JB7Q3M8K3N', 'No hay eventos operacionales para los segmentos');
noev.events = {
  events: [],
  _meta: { retrieved_at: '2026-09-15T11:02:33Z', sources_available: ['OPS_CORE', 'AIRPORT_FEED'], sources_degraded: [] },
};

export const SCENARIOS: ReadonlyMap<string, Scenario> = new Map([abc, conf, noev].map((s) => [s.booking_id, s]));
