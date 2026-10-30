import type { DisruptionAssessment, Message } from './types.js';

export class MessageValidationError extends Error {}

/**
 * Paso 6 (HU-006): plantilla cerrada por (trip_status, next_step). Los parámetros sólo salen de la
 * evaluación y sin policy_ref no se construye (así notify_passenger nunca devuelve 422 por esa causa).
 */
export function buildMessage(a: Omit<DisruptionAssessment, 'message'>, policyRef: string | undefined): Message {
  if (!policyRef) throw new MessageValidationError('message sin policy_ref');

  const created = a.escalations.find((e) => e.status === 'CREATED');
  const failed = a.escalations.some((e) => e.status === 'CREATION_FAILED');
  const delayed = a.segments.find((s) => s.status === 'DELAYED');
  const missed = a.impact?.connection
    ? a.segments.find((s) => s.segment_id === a.impact!.connection!.to_segment_id)
    : undefined;
  const params: Message['params'] = {};

  let template: string;
  if (a.trip_status === 'UNVERIFIED') {
    template = created ? 'TRIP_UNVERIFIED_AGENT_V1' : 'TRIP_UNVERIFIED_CONTACT_V1';
    params.passenger_count = a.group.passenger_count;
    if (created?.sla_minutes !== undefined) params.agent_sla_minutes = created.sla_minutes;
  } else if (a.next_step === 'ACCEPT_OPTION' && a.recommended_option) {
    template = missed ? 'DELAY_MISSED_CONNECTION_REBOOK_V1' : 'DELAY_REBOOK_V1';
    if (delayed) {
      params.delayed_flight = delayed.flight_number;
      if (delayed.new_departure_local) params.new_departure_local = delayed.new_departure_local;
    }
    if (missed) params.missed_flight = missed.flight_number;
    const o = a.recommended_option;
    if (o.flight_number) params.option_flight = o.flight_number;
    if (o.date) params.option_date = o.date;
    if (o.departure_local) params.option_departure_local = o.departure_local;
    params.passenger_count = a.group.passenger_count;
    const priority = a.escalations.find(
      (e) => e.status === 'CREATED' && a.entitlements.some((x) => x.rule_id === e.rule_id && x.entitlement === 'PRIORITY_HANDLING'),
    );
    if (priority?.sla_minutes !== undefined) params.priority_handling_sla_minutes = priority.sla_minutes;
  } else if (a.next_step === 'WAIT_FOR_AGENT') {
    template = created ? 'DELAY_MISSED_CONNECTION_AGENT_V1' : 'DELAY_CONTACT_V1';
    if (delayed) params.delayed_flight = delayed.flight_number;
    if (missed) params.missed_flight = missed.flight_number;
    params.passenger_count = a.group.passenger_count;
    if (created?.sla_minutes !== undefined) params.agent_sla_minutes = created.sla_minutes;
  } else {
    template = a.trip_status === 'INFORMATIVE_CHANGE' ? 'TRIP_INFORMATIVE_CHANGE_V1' : 'TRIP_NO_CHANGE_V1';
    if (delayed) params.delayed_flight = delayed.flight_number;
  }
  if (failed && !created) template = template.replace(/_AGENT_V1$/, '_CONTACT_V1');

  return { template_id: template, policy_ref: policyRef, params };
}
