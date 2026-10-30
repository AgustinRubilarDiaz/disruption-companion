import { createHash } from 'node:crypto';
import { evaluate, finalize, type Evaluation } from '../domain/assess.js';
import { checkInvariants } from '../domain/invariants.js';
import { optionsExpired } from '../domain/options.js';
import type {
  DecisionRecord,
  DisruptionAssessment,
  EligibleOptions,
  EngineConfig,
  Escalation,
  OperationalEvents,
} from '../domain/types.js';
import type { Clock, Tools } from '../ports/tools.js';

export class BookingNotFound extends Error {}
export class InvariantViolation extends Error {}

export interface AssessResult {
  assessment: DisruptionAssessment;
  record: DecisionRecord;
}

export interface Deps {
  tools: Tools;
  clock: Clock;
  cfg: EngineConfig;
  decisionId: () => string;
}

/** Lecturas → evaluación pura. No escribe en ningún sistema. */
export async function readAndEvaluate(booking_id: string, deps: Deps): Promise<Evaluation> {
  const { tools, clock, cfg } = deps;
  const now = clock.now();

  const trip = await tools.get_trip_context(booking_id);
  if (!trip) throw new BookingNotFound(booking_id);
  const policy = await tools.get_policy_rules('DELAY');

  const segmentIds = trip.segments.map((s) => s.segment_id);
  const events = await attempt<OperationalEvents>(() => tools.get_operational_events(segmentIds));
  let options = await attempt<EligibleOptions>(() => tools.get_eligible_options(booking_id, segmentIds[0]!));
  if (options && optionsExpired(options, now)) {
    options = await attempt<EligibleOptions>(() => tools.get_eligible_options(booking_id, segmentIds[0]!));
  }

  const decision_id = deps.decisionId();
  return evaluate({
    decision_id,
    booking_ref: `bk_${createHash('sha256').update(booking_id).digest('hex').slice(0, 6)}`,
    now,
    cfg,
    trip,
    policy,
    events,
    options,
  });
}

/** Orquesta lecturas → evaluación pura → escrituras (casos y notificación) → respuesta. */
export async function assessDisruption(booking_id: string, deps: Deps): Promise<AssessResult> {
  const { tools } = deps;
  const ev = await readAndEvaluate(booking_id, deps);
  const decision_id = ev.input.decision_id;

  const escalations: Escalation[] = [];
  for (const intent of ev.escalation_intents) {
    try {
      const hc = await tools.create_human_case({ booking_id, reason: intent.reason, decision_id });
      escalations.push({ ...intent, status: 'CREATED', case_id: hc.case_id, sla_minutes: hc.sla_minutes });
    } catch {
      escalations.push({ ...intent, status: 'CREATION_FAILED' });
    }
  }

  const draft = finalize(ev, escalations, null);
  const violations = checkInvariants(draft.assessment);
  if (violations.length > 0) throw new InvariantViolation(violations.join('; '));

  const notification = await attempt(() =>
    tools.notify_passenger({ booking_id, message: draft.assessment.message, decision_id }),
  );
  return finalize(ev, escalations, notification?.notification_id ?? null);
}

async function attempt<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
