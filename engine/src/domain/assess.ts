import { consolidate } from './consolidate.js';
import { decideControl, tripStatus, type EscalationIntent } from './control.js';
import { computeImpact } from './impact.js';
import { buildMessage } from './message.js';
import { filterOptions } from './options.js';
import { deriveFacts, evaluatePolicy } from './policy.js';
import type {
  Consolidation,
  DecisionRecord,
  DisruptionAssessment,
  EligibleOptions,
  EngineConfig,
  Entitlement,
  Escalation,
  Group,
  Impact,
  NextStep,
  OperationalEvents,
  OptionEvaluation,
  PolicyRules,
  RecommendedOption,
  RuleEvaluation,
  TripContext,
  TripStatus,
} from './types.js';

export interface EvaluationInput {
  decision_id: string;
  booking_ref: string;
  now: string;
  cfg: EngineConfig;
  trip: TripContext;
  policy: PolicyRules;
  /** null = la lectura falló. */
  events: OperationalEvents | null;
  options: EligibleOptions | null;
}

export interface Evaluation {
  input: EvaluationInput;
  group: Group;
  consolidation: Consolidation;
  impact: Impact;
  status: TripStatus;
  rule_evaluations: RuleEvaluation[];
  entitlements: Entitlement[];
  options_evaluated: OptionEvaluation[];
  recommended: RecommendedOption | null;
  next_step: NextStep;
  escalation_intents: EscalationIntent[];
}

export function groupOf(trip: TripContext): Group {
  return {
    passenger_count: trip.passengers.length,
    includes_minor: trip.passengers.some((p) => p.type !== 'ADULT' || (p.age !== undefined && p.age < 18)),
  };
}

/** Fase pura: decide todo lo que no requiere escribir en otros sistemas. */
export function evaluate(input: EvaluationInput): Evaluation {
  const { trip, policy, now, cfg } = input;
  const group = groupOf(trip);
  const feed: OperationalEvents = input.events ?? {
    events: [],
    _meta: { retrieved_at: now, sources_available: [], sources_degraded: [] },
  };
  const consolidation = consolidate(trip.segments, feed, now, cfg);
  const impact = computeImpact(consolidation.segments, cfg);
  const facts = deriveFacts(consolidation.segments, impact, group);
  const policyResult = evaluatePolicy(policy, facts);
  const unverified = consolidation.segments.some((s) => s.status === 'UNVERIFIED');
  const entitlements = unverified ? [] : policyResult.entitlements;

  const needsOptions = entitlements.some((e) => e.entitlement === 'REBOOK_NO_FEE' && e.status === 'GRANTED');
  const optionResult =
    needsOptions && input.options
      ? filterOptions(input.options, entitlements, group, trip.fare_conditions, policy.version, now)
      : { evaluations: [], recommended: null };

  const readFailure = input.events === null || (needsOptions && input.options === null);
  const status: TripStatus = readFailure ? 'UNVERIFIED' : tripStatus(consolidation, impact, entitlements);
  const control = decideControl({
    status,
    consolidation,
    entitlements,
    evaluations: policyResult.evaluations,
    recommended: status === 'UNVERIFIED' ? null : optionResult.recommended,
    policyRef: policy.version,
    readFailure,
  });

  return {
    input,
    group,
    consolidation,
    impact,
    status,
    rule_evaluations: policyResult.evaluations,
    entitlements: status === 'UNVERIFIED' ? [] : entitlements,
    options_evaluated: optionResult.evaluations,
    recommended: status === 'UNVERIFIED' ? null : optionResult.recommended,
    next_step: control.next_step,
    escalation_intents: control.escalations,
  };
}

/** Fase pura: arma la respuesta con el resultado de las escrituras (casos humanos y notificación). */
export function finalize(
  ev: Evaluation,
  escalations: Escalation[],
  notificationId: string | null,
): { assessment: DisruptionAssessment; record: DecisionRecord } {
  const { input, consolidation } = ev;
  const trip = input.trip;

  const draft: Omit<DisruptionAssessment, 'message'> = {
    schema_version: '1.0',
    decision_id: input.decision_id,
    booking_id: trip.booking_id,
    evaluated_at: input.now,
    trip_status: ev.status,
    group: ev.group,
    segments: consolidation.segments,
    ...(ev.status === 'RELEVANT_CHANGE' ? { impact: ev.impact } : {}),
    entitlements: ev.entitlements,
    recommended_option: ev.recommended,
    next_step: ev.next_step,
    escalations,
    data_quality: {
      completeness: trip._meta.completeness,
      missing_fields: trip._meta.missing_fields ?? [],
      missing_fields_critical: false,
      degraded_events_ignored: consolidation.events_discarded.filter((d) => d.reason === 'SOURCE_DEGRADED').length,
      conflicts_resolved: consolidation.conflicts_resolved,
    },
  };
  const message = buildMessage(draft, input.policy.version);
  const assessment: DisruptionAssessment = { ...draft, message };
  // Mantiene el orden de campos del contrato (message antes de data_quality).
  const { data_quality, ...rest } = assessment;
  const ordered = { ...rest, message, data_quality } as DisruptionAssessment;

  const firstCase = escalations[0];
  const record: DecisionRecord = {
    decision_id: input.decision_id,
    booking_ref: input.booking_ref,
    evaluated_at: input.now,
    policy: { policy_ref: input.policy.version, effective_from: input.policy.effective_from },
    events_used: consolidation.events_used.map(({ event_id, segment_id, type, source, recorded_at }) => ({
      event_id, segment_id, type, source, recorded_at,
    })),
    events_discarded: consolidation.events_discarded,
    rule_evaluations: ev.rule_evaluations,
    options_evaluated: ev.options_evaluated,
    outcome: ev.next_step === 'ACCEPT_OPTION' ? 'RECOMMEND' : ev.next_step === 'WAIT_FOR_AGENT' ? 'ESCALATE' : 'NO_ACTION',
    next_step: ev.next_step,
    human_case: firstCase ? { reason: firstCase.reason, case_id: firstCase.case_id ?? null } : null,
    request_id: null,
    notification_id: notificationId,
    data_quality: {
      completeness: trip._meta.completeness,
      missing_fields: trip._meta.missing_fields ?? [],
      sources_degraded: input.events?._meta.sources_degraded ?? [],
    },
  };
  return { assessment: ordered, record };
}
