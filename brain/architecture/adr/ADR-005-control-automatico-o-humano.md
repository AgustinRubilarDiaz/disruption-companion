# ADR-005 · Control automático frente a humano

- **Estado:** Propuesto (implementado como supuesto de la POC; lo acepta el usuario)
- **Fecha:** 2026-10-30
- **Decide:** usuario (DS / Tech Lead)
- **HU relacionada:** HU-004, HU-005 · **Hallazgos:** H-03, H-04, H-08 · **Decidido antes:** H-17 → RN-07

## Contexto
El enunciado pide decidir cuándo una recomendación puede ir en automático y cuándo interviene una
persona (§4), pero no lo define. Una recomendación incorrecta cuesta más que una derivación (RS-01),
y la cola `DISRUPTION_L2` tiene un SLA de 45 min (RS-08).

## Opciones consideradas
### A. Todo lo que tenga una regla con aprobación humana va completo a una persona
- A favor: lo más conservador.
- En contra: en el caso base, el pasajero con un menor (R5) espera 45 min por un cambio sin costo (R3)
  que la política ya le otorga sin aprobación.
### B. Matriz: automático sólo si todo está verificado; cada entitlement sigue su propia bandera
- A favor: el pasajero recibe en el momento lo que ya le corresponde, y lo que requiere aprobación va en paralelo.
- En contra: dos caminos a la vez (opción + caso) que hay que comunicar bien.

## Decisión
**B.** Matriz de `domain/control.ts` y `domain/options.ts`:

| Situación | `next_step` | Derivación |
|---|---|---|
| Algún segmento `UNVERIFIED` o falla una lectura | `WAIT_FOR_AGENT` | `SOURCE_CONFLICT`, `INCOMPLETE_DATA` o `READ_FAILURE` |
| Hay opción viable para todo el grupo | `ACCEPT_OPTION` | `APPROVAL_REQUIRED` en paralelo por cada entitlement `PENDING_APPROVAL` (RN-07) |
| `REBOOK_NO_FEE` otorgado y ninguna opción viable | `WAIT_FOR_AGENT` | `NO_VIABLE_OPTION` |
| Regla fuera de la gramática (ADR-004) | según lo demás | `UNSUPPORTED_RULE` |
| Sin entitlements ni derivaciones | `NO_ACTION_NEEDED` | — |

Una opción es viable si: alcanzan los asientos para todo el grupo, no cobra diferencia con un cambio
sin costo, no es un reembolso con tarifa no reembolsable, cita la política vigente, no es `LOW` y no
venció. Entre las viables se ofrece **una sola**: menor diferencia de tarifa, luego la más temprana,
luego la de mayor confianza.

Criterio que desempató: el pasajero no debe esperar por lo que la política ya le otorga sin
aprobación (RN-07), y nada pasa a automático si un dato no está verificado.

## Consecuencias
- Positivas: el caso base se resuelve en automático con el caso de R5 en paralelo; cada derivación
  lleva su motivo del catálogo cerrado.
- Negativas / costos asumidos: los criterios de filtro son supuestos (H-08); la variante conservadora
  de H-17 (todo a humano con un menor, H-17b) sigue abierta para el piloto.
- Reversibilidad: alta — la variante A cambia sólo `decideControl`; el contrato ya la soporta.

## Clasificación
| Paso | Clasificación | Razón | Riesgo | Control / fallback |
|---|---|---|---|---|
| Filtrar opciones | determinístico | Motivos cerrados | Criterio supuesto | Descartes trazados en el registro |
| Decidir el siguiente paso | determinístico | Matriz explícita | Derivar de más | Métrica de derivaciones (OV-1) |
| R4, R5, conflictos, fallas | human | La política o la duda lo exigen | Carga de L2 | Evidencia estructurada en el caso |

## Evidencia
`engine/test/unit/domain.test.ts` (filterOptions, decideControl) · caso base, `DEMOCONF` y
`DEMONOEV` en `engine/test/scenarios/EP-01_evaluacion-disrupcion.test.ts`.

## Pendiente
- Validar la matriz y los criterios de filtro con el dueño de las políticas (H-03, H-04, H-08).
- `missing_fields_critical` siempre es `false`: falta clasificar un campo faltante como crítico (H-37).
