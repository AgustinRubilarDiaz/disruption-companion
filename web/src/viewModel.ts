import { GENERIC, TEMPLATES, TEXT, type Ctx, type Kind } from './copy';
import type { Assessment } from './types';

export interface ViewModel {
  kind: Kind;
  alert: string;
  impact?: string;
  next: string;
  notice?: string;
  reference?: string;
  dataAsOf?: string;
  option?: { optionId: string; confirmText: string; validForSeconds: number };
  /** Sólo con next_step = ACCEPT_OPTION, una opción y una plantilla conocida de oferta. */
  canAccept: boolean;
}

/** Función pura: lee el contrato y arma lo que se muestra. No calcula entitlements, elegibilidad ni conexiones. */
export function toViewModel(a: Assessment): ViewModel {
  const sections = TEMPLATES[a.message.template_id] ?? GENERIC;
  const ctx: Ctx = { ...a.message.params, connection_departure: a.impact?.connection?.next_departure_local };

  const created = a.escalations.find((e) => e.status === 'CREATED' && e.case_id);
  const dataAsOf = a.segments
    .map((s) => s.data_as_of)
    .filter((d): d is string => !!d)
    .sort()[0];
  const opt = a.recommended_option;
  const canAccept = a.next_step === 'ACCEPT_OPTION' && opt !== null && sections.kind === 'REBOOK_OFFER';

  return {
    kind: sections.kind,
    alert: sections.alert(ctx),
    impact: sections.impact?.(ctx),
    next: sections.next(ctx),
    notice: sections.notice?.(ctx),
    reference: created?.case_id ? TEXT.reference(created.case_id) : undefined,
    dataAsOf: dataAsOf ? TEXT.dataAsOf(dataAsOf.slice(11, 16)) : undefined,
    option: canAccept && opt
      ? {
          optionId: opt.option_id,
          confirmText: TEXT.confirmAsk(ctx),
          validForSeconds: Math.max(0, Math.round((Date.parse(opt.valid_until) - Date.parse(a.evaluated_at)) / 1000)),
        }
      : undefined,
    canAccept,
  };
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
