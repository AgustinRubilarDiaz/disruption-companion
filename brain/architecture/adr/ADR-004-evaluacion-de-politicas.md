# ADR-004 · Evaluación de las condiciones de la política

- **Estado:** Propuesto (implementado como supuesto de la POC; lo acepta el usuario)
- **Fecha:** 2026-10-30
- **Decide:** usuario (DS / Tech Lead)
- **HU relacionada:** HU-003 · **Hallazgo:** H-13

## Contexto
`get_policy_rules` entrega cada regla con su `condition` como texto
(`"delay_minutes >= 240 AND international"`). Lo que le corresponde al pasajero sale de esas reglas
(RN-01), y la política es versionada: puede cambiar sin que cambie el código. El plan de la épica
proponía "un predicado en código por `rule_id`", pero **la POC implementó otra cosa**: un intérprete
acotado. Este ADR registra lo implementado y deja la elección al usuario.

## Opciones consideradas
### A. Un predicado en código por `rule_id`
- A favor: cada regla está revisada a mano; nada se interpreta.
- En contra: una versión nueva de la política (otra `R6`, otro umbral) exige desplegar código; si el
  `rule_id` existe pero la `condition` cambió, el código aplica la regla vieja sin enterarse.
### B. Intérprete acotado: `hecho op valor` unidos por `AND`, sobre un catálogo cerrado de hechos
- A favor: lee la `condition` real de la versión vigente, así que un cambio de umbral se respeta sin
  desplegar; todo lo que no entiende (un `OR`, un hecho desconocido) se trata como regla no soportada.
- En contra: hay que mantener el catálogo de hechos; una gramática mal ampliada podría aplicar una regla de más.
### C. Motor de expresiones general (o un modelo de IA)
- A favor: entiende cualquier condición.
- En contra: superficie de error y de seguridad grande; con IA, viola ADR-009.

## Decisión
**B** (lo implementado). Catálogo de hechos: `delay_minutes`, `international`, `missed_connection`,
`compensation_requested`, `group_includes_minor`. Operadores: `>=`, `<=`, `>`, `<`, `==`, y un hecho
solo equivale a `== true`. Una condición fuera de esa gramática **no se aplica** y se deriva con
`UNSUPPORTED_RULE`. Si dos reglas otorgan el mismo entitlement, se conserva uno y gana el que no
requiere aprobación (RN-07).

Criterio que desempató: respetar la versión vigente de la política sin desplegar (RN-01) y, ante lo
desconocido, derivar en vez de adivinar.

## Consecuencias
- Positivas: la `rule_evaluations` del registro guarda los hechos usados por cada regla (HU-008); el
  umbral de R1 o R2 puede cambiar en la política sin tocar el código.
- Negativas / costos asumidos: hechos derivados con supuestos (`international` por una tabla
  aeropuerto → país en `policy.ts`; `compensation_requested` siempre `false`, H-14).
- Reversibilidad: alta — pasar a A es reemplazar `parseCondition` por un mapa `rule_id → predicado`.

## Clasificación
| Paso | Clasificación | Razón | Riesgo | Control / fallback |
|---|---|---|---|---|
| Evaluar la política | determinístico | Gramática cerrada | Regla nueva fuera de la gramática | `UNSUPPORTED_RULE` → humano |

## Evidencia
`engine/test/unit/domain.test.ts`: "R3 se otorga y R5 queda pendiente…", "una condición que no
entiende queda como regla no soportada".

## Pendiente
- Si el usuario prefiere A, hay que cambiar `policy.ts`. Si acepta B, la épica deja de decir
  "predicados por `rule_id`" (H-13 y RD-12 ya se corrigieron a lo implementado).
- Origen de `compensation_requested` (H-14).
