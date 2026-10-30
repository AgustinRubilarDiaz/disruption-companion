import type {
  ConsolidatedSegment,
  Entitlement,
  Facts,
  Group,
  Impact,
  PolicyRules,
  RuleEvaluation,
} from './types.js';

const AIRPORT_COUNTRY: Record<string, string> = {
  SCL: 'CL', LIM: 'PE', MEX: 'MX', GRU: 'BR', BOG: 'CO', MIA: 'US', MAD: 'ES',
};

export function deriveFacts(
  segments: ConsolidatedSegment[],
  impact: Impact,
  group: Group,
  compensationRequested = false,
): Facts {
  const international = segments.some((s) => {
    const o = AIRPORT_COUNTRY[s.origin];
    const d = AIRPORT_COUNTRY[s.destination];
    return !!o && !!d && o !== d;
  });
  return {
    delay_minutes: Math.max(0, ...segments.map((s) => s.delay_minutes ?? 0)),
    international,
    missed_connection: impact.missed_connection,
    compensation_requested: compensationRequested,
    group_includes_minor: group.includes_minor,
  };
}

type Term = { fact: keyof Facts; op: '>=' | '<=' | '>' | '<' | '=='; value: number | boolean };

/** Sólo entiende `hecho op valor` y `hecho` unidos por AND. Lo demás es una regla no soportada. */
function parseCondition(condition: string): Term[] | null {
  const terms: Term[] = [];
  for (const raw of condition.split(/\s+AND\s+/)) {
    const part = raw.trim();
    const cmp = /^(\w+)\s*(>=|<=|==|>|<)\s*(\w+)$/.exec(part);
    const fact = (cmp ? cmp[1] : part) as keyof Facts;
    if (!isFact(fact)) return null;
    if (!cmp) {
      terms.push({ fact, op: '==', value: true });
      continue;
    }
    const lit = cmp[3]!;
    const value = lit === 'true' ? true : lit === 'false' ? false : Number(lit);
    if (typeof value === 'number' && Number.isNaN(value)) return null;
    terms.push({ fact, op: cmp[2] as Term['op'], value });
  }
  return terms;
}

const FACTS: (keyof Facts)[] = [
  'delay_minutes', 'international', 'missed_connection', 'compensation_requested', 'group_includes_minor',
];
function isFact(x: string): x is keyof Facts {
  return (FACTS as string[]).includes(x);
}

function holds(t: Term, facts: Facts): boolean {
  const v = facts[t.fact];
  switch (t.op) {
    case '==': return v === t.value;
    case '>=': return (v as number) >= (t.value as number);
    case '<=': return (v as number) <= (t.value as number);
    case '>': return (v as number) > (t.value as number);
    case '<': return (v as number) < (t.value as number);
  }
}

/** Paso 3 (HU-003): evalúa cada regla con hechos ya calculados; cada entitlement conserva su propia bandera (P-17). */
export function evaluatePolicy(
  policy: PolicyRules,
  facts: Facts,
): { evaluations: RuleEvaluation[]; entitlements: Entitlement[] } {
  const evaluations: RuleEvaluation[] = [];
  const byEntitlement = new Map<string, Entitlement>();

  for (const rule of policy.rules) {
    const terms = parseCondition(rule.condition);
    if (!terms) {
      evaluations.push({ rule_id: rule.rule_id, applies: false, supported: false, facts: {} });
      continue;
    }
    const used: Partial<Facts> = {};
    for (const t of terms) (used as Record<string, unknown>)[t.fact] = facts[t.fact];
    const applies = terms.every((t) => holds(t, facts));
    evaluations.push({ rule_id: rule.rule_id, applies, supported: true, facts: used });
    if (!applies) continue;

    const candidate: Entitlement = {
      entitlement: rule.entitlement,
      policy_ref: policy.version,
      rule_id: rule.rule_id,
      requires_human_approval: rule.requires_human_approval,
      status: rule.requires_human_approval ? 'PENDING_APPROVAL' : 'GRANTED',
    };
    const prev = byEntitlement.get(rule.entitlement);
    if (!prev || (prev.requires_human_approval && !candidate.requires_human_approval)) {
      byEntitlement.set(rule.entitlement, candidate);
    }
  }
  return { evaluations, entitlements: [...byEntitlement.values()] };
}
