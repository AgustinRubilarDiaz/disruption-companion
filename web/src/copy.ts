// Textos por template_id. Es presentación, no regla: los valores salen sólo de message.params
// (y de impact.connection), nunca de un cálculo propio.

export type Ctx = Record<string, string | number | undefined>;
export type Kind = 'REBOOK_OFFER' | 'WAIT_FOR_AGENT' | 'UNVERIFIED' | 'INFO' | 'NO_CHANGE' | 'UNKNOWN';

export interface Sections {
  kind: Kind;
  alert: (c: Ctx) => string;
  impact?: (c: Ctx) => string;
  next: (c: Ctx) => string;
  notice?: (c: Ctx) => string | undefined;
}

export const CONTACT = 'Contacta a un agente de LATAM: te ayudaremos con tus alternativas.';
export const UNVERIFIED_ALERT = 'No pudimos confirmar el estado de tu viaje.';

const pax = (n: unknown) => `${n} pasajero${Number(n) === 1 ? '' : 's'}`;
const agent = (c: Ctx, tail: string) =>
  c.agent_sla_minutes !== undefined ? `Un agente te contactará en ${c.agent_sla_minutes} minutos ${tail}.` : CONTACT;

const delayAlert = (c: Ctx) =>
  c.new_departure_local
    ? `Tu vuelo ${c.delayed_flight} sale ahora a las ${c.new_departure_local}.`
    : `Tu vuelo ${c.delayed_flight} tiene un retraso.`;
const missedImpact = (c: Ctx) =>
  `Con este retraso no llegas a tu conexión ${c.missed_flight}${c.connection_departure ? ` de las ${c.connection_departure}` : ''}.`;
const offer = (c: Ctx) =>
  `Te ofrecemos el vuelo ${c.option_flight} del ${c.option_date} a las ${c.option_departure_local} para ${pax(c.passenger_count)}, sin costo adicional.`;
const priorityNotice = (c: Ctx) =>
  c.priority_handling_sla_minutes !== undefined
    ? `Un agente te contactará en ${c.priority_handling_sla_minutes} minutos para la atención prioritaria de tu grupo.`
    : undefined;

export const TEMPLATES: Record<string, Sections> = {
  DELAY_MISSED_CONNECTION_REBOOK_V1: { kind: 'REBOOK_OFFER', alert: delayAlert, impact: missedImpact, next: offer, notice: priorityNotice },
  DELAY_REBOOK_V1: { kind: 'REBOOK_OFFER', alert: delayAlert, next: offer, notice: priorityNotice },
  DELAY_MISSED_CONNECTION_AGENT_V1: {
    kind: 'WAIT_FOR_AGENT',
    alert: (c) => `Tu vuelo ${c.delayed_flight} tiene un retraso.`,
    impact: missedImpact,
    next: (c) => agent(c, 'para ofrecerte alternativas'),
  },
  DELAY_CONTACT_V1: { kind: 'WAIT_FOR_AGENT', alert: (c) => `Tu vuelo ${c.delayed_flight} tiene un retraso.`, next: () => CONTACT },
  TRIP_UNVERIFIED_AGENT_V1: { kind: 'UNVERIFIED', alert: () => UNVERIFIED_ALERT, next: (c) => agent(c, 'con novedades') },
  TRIP_UNVERIFIED_CONTACT_V1: { kind: 'UNVERIFIED', alert: () => UNVERIFIED_ALERT, next: () => CONTACT },
  TRIP_INFORMATIVE_CHANGE_V1: {
    kind: 'INFO',
    alert: (c) => `Hay una actualización en tu vuelo ${c.delayed_flight}.`,
    next: () => 'No necesitas hacer nada por ahora.',
  },
  TRIP_NO_CHANGE_V1: { kind: 'NO_CHANGE', alert: () => 'No hay cambios en tu viaje.', next: () => 'No necesitas hacer nada.' },
};

/** Plantilla o enum desconocidos: estado genérico y contacto. Nunca se deduce nada (Docs/16 §16.4). */
export const GENERIC: Sections = { kind: 'UNKNOWN', alert: () => UNVERIFIED_ALERT, next: () => CONTACT };

export const TEXT = {
  accept: 'Aceptar este cambio',
  confirmAsk: (c: Ctx) =>
    `¿Confirmas el cambio al vuelo ${c.option_flight} del ${c.option_date} a las ${c.option_departure_local} para ${pax(c.passenger_count)}?`,
  confirmYes: 'Sí, solicitar el cambio',
  confirmNo: 'Volver',
  sending: 'Enviando tu solicitud…',
  requested: (until?: string) => `Solicitud enviada: pendiente de confirmación${until ? ` hasta las ${until} UTC` : ''}.`,
  requestRef: (id: string) => `N.º de la solicitud: ${id}`,
  confirming: 'Estamos confirmando tu solicitud.',
  expired: 'La opción venció. Actualiza para ver las opciones vigentes.',
  rejected: 'Esta opción ya no está disponible. Actualiza para ver las opciones vigentes.',
  failed: 'No pudimos enviar tu solicitud. Intenta de nuevo.',
  refresh: 'Actualizar',
  loadError: 'No pudimos cargar el estado de tu viaje. Intenta de nuevo.',
  reference: (id: string) => `N.º de referencia: ${id}`,
  dataAsOf: (hhmm: string) => `Datos actualizados a las ${hhmm} UTC`,
};
