import type { DisruptionAssessment } from './types.js';

export const PII_KEYS = ['name', 'email', 'phone', 'document_id', 'loyalty_tier'] as const;

/** Invariantes 1 a 10 de Docs/16 §16.3. Devuelve las violaciones; vacío = cumple. */
export function checkInvariants(a: DisruptionAssessment): string[] {
  const v: string[] = [];
  const hasOption = a.recommended_option !== null;

  if ((a.next_step === 'ACCEPT_OPTION') !== hasOption) v.push('1: ACCEPT_OPTION ⇔ recommended_option');
  if (a.recommended_option && Date.parse(a.recommended_option.valid_until) <= Date.parse(a.evaluated_at)) {
    v.push('2: valid_until no es posterior a evaluated_at');
  }
  if (a.trip_status === 'UNVERIFIED' && (hasOption || a.next_step !== 'WAIT_FOR_AGENT' || a.escalations.length === 0)) {
    v.push('3: UNVERIFIED sin WAIT_FOR_AGENT + derivación');
  }
  if (a.entitlements.some((e) => !e.policy_ref || !e.rule_id) || !a.message.policy_ref) v.push('4: falta policy_ref o rule_id');

  const values = collectValues({ ...a, message: undefined });
  for (const [k, p] of Object.entries(a.message.params)) {
    if (!values.has(String(p))) v.push(`5: message.params.${k} no está en la evaluación`);
  }
  // 6: la respuesta sólo puede contener la opción recomendada.
  const optionIds = JSON.stringify(a).match(/"option_id":"[^"]+"/g) ?? [];
  if (optionIds.length > (hasOption ? 1 : 0)) v.push('6: aparece una opción descartada');
  const pii = findPiiKeys(a);
  if (pii.length > 0) v.push(`7: datos personales: ${pii.join(', ')}`);
  for (const s of a.segments) {
    if (s.status !== 'UNVERIFIED' && !s.data_as_of) v.push(`8: ${s.segment_id} sin data_as_of`);
  }
  if (a.escalations.some((e) => e.status === 'CREATION_FAILED') && a.message.template_id.includes('_AGENT_')) {
    v.push('10: menciona un caso que no se creó');
  }
  return v;
}

export function findPiiKeys(obj: unknown): string[] {
  const found = new Set<string>();
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (x && typeof x === 'object') {
      for (const [k, val] of Object.entries(x)) {
        if ((PII_KEYS as readonly string[]).includes(k)) found.add(k);
        walk(val);
      }
    }
  };
  walk(obj);
  return [...found];
}

function collectValues(obj: unknown, acc = new Set<string>()): Set<string> {
  if (Array.isArray(obj)) obj.forEach((x) => collectValues(x, acc));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((x) => collectValues(x, acc));
  else if (obj !== undefined && obj !== null) acc.add(String(obj));
  return acc;
}
