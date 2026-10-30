import { addSeconds } from './time.js';
import type {
  DiscardReason,
  EligibleOption,
  EligibleOptions,
  Entitlement,
  Group,
  OptionEvaluation,
  RecommendedOption,
  TripContext,
} from './types.js';

const CONFIDENCE_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export function optionsValidUntil(options: EligibleOptions): string {
  return addSeconds(options._meta.retrieved_at, options._meta.ttl_seconds);
}

export function optionsExpired(options: EligibleOptions, now: string): boolean {
  return Date.parse(optionsValidUntil(options)) <= Date.parse(now);
}

/** Paso 4 (HU-004): descarta con motivo (catálogo Docs/16 §16.7) y elige una sola opción. */
export function filterOptions(
  options: EligibleOptions,
  entitlements: Entitlement[],
  group: Group,
  fare: TripContext['fare_conditions'],
  policyRef: string,
  now: string,
): { evaluations: OptionEvaluation[]; recommended: RecommendedOption | null } {
  const noFee = entitlements.some((e) => e.entitlement === 'REBOOK_NO_FEE' && e.status === 'GRANTED');
  const expired = optionsExpired(options, now);
  const validUntil = optionsValidUntil(options);

  const evaluated = options.options.map((o) => ({ option: o, reasons: discardReasons(o, noFee, group, fare, policyRef, expired) }));
  const viable = evaluated
    .filter((e) => e.reasons.length === 0)
    .map((e) => e.option)
    .sort(byPreference);
  const best = viable[0];

  const evaluations: OptionEvaluation[] = evaluated.map(({ option, reasons }) => ({
    option_id: option.option_id,
    confidence: option.confidence,
    result: reasons.length > 0 ? 'DISCARDED' : option === best ? 'RECOMMENDED' : 'VIABLE',
    reasons,
  }));

  const recommended: RecommendedOption | null = best
    ? {
        option_id: best.option_id,
        type: best.type,
        flight_number: best.flight_number,
        origin: best.origin,
        destination: best.destination,
        date: best.date,
        departure_local: best.departure,
        fare_difference: best.fare_difference ?? 0,
        covers_passengers: group.passenger_count,
        policy_ref: best.policy_ref,
        valid_until: validUntil,
      }
    : null;
  return { evaluations, recommended };
}

function discardReasons(
  o: EligibleOption,
  noFee: boolean,
  group: Group,
  fare: TripContext['fare_conditions'],
  policyRef: string,
  expired: boolean,
): DiscardReason[] {
  const r: DiscardReason[] = [];
  if (o.type === 'REBOOK' && (o.seats_available ?? 0) < group.passenger_count) r.push('SEATS_INSUFFICIENT');
  if (o.type === 'REBOOK' && noFee && (o.fare_difference ?? 0) > 0) r.push('FARE_DIFFERENCE_CONFLICTS_ENTITLEMENT');
  if (o.type === 'REFUND' && !fare.refundable) r.push('NON_REFUNDABLE_FARE');
  if (o.policy_ref !== policyRef) r.push('POLICY_NOT_AVAILABLE');
  if (o.confidence === 'LOW') r.push('LOW_CONFIDENCE');
  if (expired) r.push('EXPIRED');
  return r;
}

function byPreference(a: EligibleOption, b: EligibleOption): number {
  const fare = (a.fare_difference ?? 0) - (b.fare_difference ?? 0);
  if (fare !== 0) return fare;
  const when = `${a.date ?? ''}T${a.departure ?? ''}`.localeCompare(`${b.date ?? ''}T${b.departure ?? ''}`);
  if (when !== 0) return when;
  return CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
}
