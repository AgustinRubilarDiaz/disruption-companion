import type {
  Consolidation,
  Entitlement,
  EscalationReason,
  Impact,
  NextStep,
  RecommendedOption,
  RuleEvaluation,
  TripStatus,
} from './types.js';

export interface EscalationIntent {
  reason: EscalationReason;
  policy_ref?: string;
  rule_id?: string;
}

export function tripStatus(c: Consolidation, impact: Impact, entitlements: Entitlement[]): TripStatus {
  if (c.segments.some((s) => s.status === 'UNVERIFIED')) return 'UNVERIFIED';
  if (impact.missed_connection || entitlements.length > 0) return 'RELEVANT_CHANGE';
  if (c.segments.some((s) => s.status === 'DELAYED' || s.gate !== undefined)) return 'INFORMATIVE_CHANGE';
  return 'NO_CHANGE';
}

/** Paso 5 (HU-005): un único siguiente paso y las derivaciones a una persona. */
export function decideControl(input: {
  status: TripStatus;
  consolidation: Consolidation;
  entitlements: Entitlement[];
  evaluations: RuleEvaluation[];
  recommended: RecommendedOption | null;
  policyRef: string;
  readFailure: boolean;
}): { next_step: NextStep; escalations: EscalationIntent[] } {
  const { status, consolidation, entitlements, evaluations, recommended, policyRef, readFailure } = input;

  if (status === 'UNVERIFIED' || readFailure) {
    const reason: EscalationReason = readFailure
      ? 'READ_FAILURE'
      : consolidation.conflict_segments.length > 0
        ? 'SOURCE_CONFLICT'
        : 'INCOMPLETE_DATA';
    return { next_step: 'WAIT_FOR_AGENT', escalations: [{ reason }] };
  }

  const escalations: EscalationIntent[] = entitlements
    .filter((e) => e.status === 'PENDING_APPROVAL')
    .map((e) => ({ reason: 'APPROVAL_REQUIRED', policy_ref: e.policy_ref, rule_id: e.rule_id }));
  for (const ev of evaluations.filter((e) => !e.supported)) {
    escalations.push({ reason: 'UNSUPPORTED_RULE', policy_ref: policyRef, rule_id: ev.rule_id });
  }

  const needsRebook = entitlements.some((e) => e.entitlement === 'REBOOK_NO_FEE' && e.status === 'GRANTED');
  if (recommended) return { next_step: 'ACCEPT_OPTION', escalations };
  if (needsRebook) {
    escalations.push({ reason: 'NO_VIABLE_OPTION', policy_ref: policyRef });
    return { next_step: 'WAIT_FOR_AGENT', escalations };
  }
  if (escalations.length > 0) return { next_step: 'WAIT_FOR_AGENT', escalations };
  return { next_step: 'NO_ACTION_NEEDED', escalations };
}
