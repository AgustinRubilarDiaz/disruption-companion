import type { Clock, RebookingResult, Tools } from '../../ports/tools.js';
import type { HumanCase, Notification } from '../../domain/types.js';
import type { Scenario } from './scenarios.js';

/**
 * Memoria de las escrituras. Las tools reales reciben `decision_id` como evidencia; el mock la usa
 * para que repetir una consulta no cree un segundo caso ni una segunda notificación (H-30).
 * Las solicitudes de cambio se deduplican por clave de idempotencia (201 la primera vez, 409 después).
 */
export class MockState {
  readonly cases = new Map<string, HumanCase>();
  readonly notifications = new Map<string, Notification>();
  readonly requests = new Map<string, { request_id: string; status: string; expires_at: string }>();
  readonly writes: { tool: string; input: unknown }[] = [];
}

/** Tools simuladas de un escenario. Las escrituras quedan registradas para los tests. */
export class MockTools implements Tools {
  constructor(
    private readonly scenario: Scenario,
    private readonly state: MockState = new MockState(),
  ) {}

  get writes() {
    return this.state.writes;
  }

  async get_trip_context(booking_id: string) {
    return booking_id === this.scenario.booking_id ? structuredClone(this.scenario.trip) : null;
  }
  async get_operational_events(segment_ids: string[]) {
    const e = structuredClone(this.scenario.events);
    e.events = e.events.filter((x) => segment_ids.includes(x.segment_id));
    return e;
  }
  async get_eligible_options() {
    return structuredClone(this.scenario.options);
  }
  async get_policy_rules() {
    return structuredClone(this.scenario.policy);
  }
  async create_rebooking_request(_b: string, _o: string, idempotency_key: string): Promise<RebookingResult> {
    const existing = this.state.requests.get(idempotency_key);
    if (existing) return { ...existing, duplicate: true }; // el 409 DUPLICATE_REQUEST se trata como éxito
    const created = { ...this.scenario.rebooking };
    this.state.requests.set(idempotency_key, created);
    this.state.writes.push({ tool: 'create_rebooking_request', input: { idempotency_key } });
    return { ...created, duplicate: false };
  }
  async create_human_case(input: { booking_id: string; reason: string; decision_id: string }) {
    const key = `${input.decision_id}|${input.reason}`;
    const existing = this.state.cases.get(key);
    if (existing) return existing;
    this.state.writes.push({ tool: 'create_human_case', input });
    this.state.cases.set(key, this.scenario.human_case);
    return this.scenario.human_case;
  }
  async notify_passenger(input: Parameters<Tools['notify_passenger']>[0]) {
    if (!input.message.policy_ref) throw new Error('422 UNVALIDATED_CONTENT');
    const existing = this.state.notifications.get(input.decision_id);
    if (existing) return existing;
    this.state.writes.push({ tool: 'notify_passenger', input });
    this.state.notifications.set(input.decision_id, this.scenario.notification);
    return this.scenario.notification;
  }
}

export function fixedClock(iso: string): Clock {
  return { now: () => iso };
}
