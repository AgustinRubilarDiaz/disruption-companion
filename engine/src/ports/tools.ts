import type {
  EligibleOptions,
  HumanCase,
  Message,
  Notification,
  OperationalEvents,
  PolicyRules,
  TripContext,
} from '../domain/types.js';

export interface RebookingResult {
  request_id: string;
  status: string;
  expires_at: string;
  /** La tool respondió 409 DUPLICATE_REQUEST: la solicitud ya existía con esta clave. */
  duplicate: boolean;
}

/** Las 7 tools del enunciado (brain/contracts/tools-api.md). El motor sólo conoce este puerto. */
export interface Tools {
  get_trip_context(booking_id: string): Promise<TripContext | null>;
  get_operational_events(segment_ids: string[]): Promise<OperationalEvents>;
  get_eligible_options(booking_id: string, segment_id: string): Promise<EligibleOptions>;
  get_policy_rules(scenario: 'DELAY'): Promise<PolicyRules>;
  create_rebooking_request(booking_id: string, option_id: string, idempotency_key: string): Promise<RebookingResult>;
  create_human_case(input: { booking_id: string; reason: string; decision_id: string }): Promise<HumanCase>;
  notify_passenger(input: { booking_id: string; message: Message; decision_id: string }): Promise<Notification>;
}

export interface Clock {
  now(): string;
}
