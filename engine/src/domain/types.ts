// ── Entrada: contratos de las tools (brain/contracts/tools-api.md) ──────────────

export interface Passenger {
  passenger_id: string;
  type: 'ADULT' | 'CHILD' | 'INFANT';
  age?: number;
  [pii: string]: unknown;
}

export interface TripSegment {
  segment_id: string;
  flight_number: string;
  origin: string;
  destination: string;
  date: string;
  scheduled_departure: string;
  scheduled_arrival: string;
}

export interface TripContext {
  booking_id: string;
  passengers: Passenger[];
  segments: TripSegment[];
  fare_conditions: { changeable: boolean; refundable: boolean; fare_family: string };
  _meta: { retrieved_at: string; completeness: 'COMPLETE' | 'PARTIAL'; missing_fields?: string[] };
}

export interface OperationalEvent {
  event_id: string;
  segment_id: string;
  type: 'DELAY' | 'GATE_CHANGE' | 'STATUS' | string;
  new_departure?: string;
  delay_minutes?: number;
  gate?: string;
  status?: string;
  source: string;
  recorded_at: string;
}

export interface OperationalEvents {
  events: OperationalEvent[];
  _meta: { retrieved_at: string; sources_available: string[]; sources_degraded: string[] };
}

export interface EligibleOption {
  option_id: string;
  type: 'REBOOK' | 'REFUND' | string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  date?: string;
  departure?: string;
  fare_difference?: number;
  currency?: string;
  seats_available?: number;
  policy_ref: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface EligibleOptions {
  options: EligibleOption[];
  _meta: { retrieved_at: string; ttl_seconds: number };
}

export interface PolicyRule {
  rule_id: string;
  condition: string;
  entitlement: string;
  requires_human_approval: boolean;
}

export interface PolicyRules {
  scenario: string;
  version: string;
  effective_from: string;
  rules: PolicyRule[];
  _meta: { retrieved_at: string; superseded_versions: string[] };
}

export interface HumanCase {
  case_id: string;
  queue: string;
  sla_minutes: number;
}

export interface Notification {
  notification_id: string;
  channel: string;
  status: string;
}

// ── Dominio ──────────────────────────────────────────────────────────────────────

export interface EngineConfig {
  max_event_age_minutes: number;
  mct_minutes: number;
}

export const DEFAULT_CONFIG: EngineConfig = { max_event_age_minutes: 30, mct_minutes: 0 };

export type SegmentStatus = 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'UNVERIFIED';
export type TripStatus = 'NO_CHANGE' | 'INFORMATIVE_CHANGE' | 'RELEVANT_CHANGE' | 'UNVERIFIED';
export type NextStep = 'ACCEPT_OPTION' | 'WAIT_FOR_AGENT' | 'NO_ACTION_NEEDED';
export type EscalationReason =
  | 'APPROVAL_REQUIRED'
  | 'SOURCE_CONFLICT'
  | 'INCOMPLETE_DATA'
  | 'NO_VIABLE_OPTION'
  | 'UNSUPPORTED_RULE'
  | 'REBOOKING_INDETERMINATE'
  | 'READ_FAILURE';
export type DiscardReason =
  | 'SEATS_INSUFFICIENT'
  | 'FARE_DIFFERENCE_CONFLICTS_ENTITLEMENT'
  | 'NON_REFUNDABLE_FARE'
  | 'POLICY_NOT_AVAILABLE'
  | 'LOW_CONFIDENCE'
  | 'EXPIRED';

export interface Group {
  passenger_count: number;
  includes_minor: boolean;
}

export interface DiscardedEvent {
  event_id: string;
  segment_id: string;
  source: string;
  reason: 'SOURCE_DEGRADED' | 'STALE' | 'SUPERSEDED';
}

export interface ConsolidatedSegment {
  segment_id: string;
  flight_number: string;
  origin: string;
  destination: string;
  date: string;
  status: SegmentStatus;
  scheduled_departure_local: string;
  new_departure_local?: string;
  delay_minutes?: number;
  scheduled_arrival_local: string;
  estimated_arrival_local?: string;
  gate?: string;
  data_as_of?: string;
}

export interface Consolidation {
  segments: ConsolidatedSegment[];
  events_used: OperationalEvent[];
  events_discarded: DiscardedEvent[];
  conflict_segments: string[];
  no_data_segments: string[];
  conflicts_resolved: number;
}

export interface Impact {
  missed_connection: boolean;
  connection?: {
    from_segment_id: string;
    to_segment_id: string;
    estimated_arrival_local: string;
    next_departure_local: string;
    mct_minutes: number;
  };
  delay_basis: 'PER_SEGMENT';
}

export interface Facts {
  delay_minutes: number;
  international: boolean;
  missed_connection: boolean;
  compensation_requested: boolean;
  group_includes_minor: boolean;
}

export interface RuleEvaluation {
  rule_id: string;
  applies: boolean;
  supported: boolean;
  facts: Partial<Facts>;
}

export interface Entitlement {
  entitlement: string;
  policy_ref: string;
  rule_id: string;
  requires_human_approval: boolean;
  status: 'GRANTED' | 'PENDING_APPROVAL';
}

export interface OptionEvaluation {
  option_id: string;
  confidence: EligibleOption['confidence'];
  result: 'RECOMMENDED' | 'VIABLE' | 'DISCARDED';
  reasons: DiscardReason[];
}

export interface RecommendedOption {
  option_id: string;
  type: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  date?: string;
  departure_local?: string;
  fare_difference: number;
  covers_passengers: number;
  policy_ref: string;
  valid_until: string;
}

export interface Escalation {
  reason: EscalationReason;
  policy_ref?: string;
  rule_id?: string;
  status: 'CREATED' | 'CREATION_FAILED';
  case_id?: string;
  sla_minutes?: number;
}

export interface Message {
  template_id: string;
  policy_ref: string;
  params: Record<string, string | number>;
}

export interface DataQuality {
  completeness: 'COMPLETE' | 'PARTIAL';
  missing_fields: string[];
  missing_fields_critical: boolean;
  degraded_events_ignored: number;
  conflicts_resolved: number;
}

// ── Salida: DisruptionAssessment v1.0 (Docs/16) ─────────────────────────────────

export interface DisruptionAssessment {
  schema_version: '1.0';
  decision_id: string;
  booking_id: string;
  evaluated_at: string;
  trip_status: TripStatus;
  group: Group;
  segments: ConsolidatedSegment[];
  impact?: Impact;
  entitlements: Entitlement[];
  recommended_option: RecommendedOption | null;
  next_step: NextStep;
  escalations: Escalation[];
  message: Message;
  data_quality: DataQuality;
}

export interface DecisionRecord {
  decision_id: string;
  booking_ref: string;
  evaluated_at: string;
  policy: { policy_ref: string; effective_from: string } | null;
  events_used: Pick<OperationalEvent, 'event_id' | 'segment_id' | 'type' | 'source' | 'recorded_at'>[];
  events_discarded: DiscardedEvent[];
  rule_evaluations: RuleEvaluation[];
  options_evaluated: OptionEvaluation[];
  outcome: 'RECOMMEND' | 'ESCALATE' | 'NO_ACTION';
  next_step: NextStep;
  human_case: { reason: EscalationReason; case_id: string | null } | null;
  request_id: string | null;
  notification_id: string | null;
  data_quality: { completeness: string; missing_fields: string[]; sources_degraded: string[] };
}
