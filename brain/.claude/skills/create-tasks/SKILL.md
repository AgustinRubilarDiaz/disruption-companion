---
name: dc-create-tasks
description: Disruption Companion — crea una HU, Falla o deuda técnica en brain/backlog/.
---

# Skill: Create Tasks

## Anuncio de fase
Falla (P3): `▶ [P3 · 1/5 · create-tasks · razonamiento]` · HU o deuda fuera de un protocolo: `▶ [create-tasks · razonamiento]`
Si falta información: `⏸ [create-tasks · razonamiento] — esperando datos para completar el ticket`

## Cuándo ejecutar
Hay que crear un ticket: historia de usuario, **Falla** o deuda técnica. Para bugs es el paso 1
del **Protocol 3**.

## Salida
Archivo en `brain/backlog/` desde `_templates/` + fila en el índice de `backlog/README.md`.

## Pasos

### 1. Determinar el tipo
| Tipo | Prefijo | Cuándo |
|---|---|---|
| Historia | `HU-XXX` | Capacidad con valor para el pasajero o la operación |
| Falla | `FALLA-XXX` | Comportamiento distinto al `.feature` o a una RN |
| Deuda técnica | `DT-XXX` | Trabajo necesario sin valor funcional directo |

Siguiente número libre según `backlog/README.md`. Nunca reutilizar un ID.

### 2. Para una HU
Completar `_templates/hu.md` (deuda técnica: `_templates/deuda-tecnica.md`): historia, ACs verificables (Dado/Cuando/Entonces), RN tocadas,
componentes y contratos, clasificación de pasos, estimación en minutos, hallazgos abiertos.

### 3. Para una Falla
Completar `_templates/falla.md`: error observado, pasos de reproducción con el fixture usado,
esperado (citando el `.feature` o la RN) vs observado, causa raíz si se conoce.

Antes, descartar falsos positivos con `operations/triage.md`:
- [ ] ¿Es un comportamiento esperado de una tool (409, 503, 422, PARTIAL, fuente degradada)?
- [ ] ¿Es un comportamiento todavía no decidido (hallazgo abierto)? → no es Falla, es pregunta.
- [ ] ¿Está marcado `@bug-conocido` en un `.feature`?

Si es alguno, **no crear la Falla**: explicar por qué.

### 4. Mostrar y esperar
Mostrar el contenido completo del archivo y esperar aprobación antes de escribirlo.

### 5. Siguiente paso
- HU → queda en `Borrador` hasta el sign-off; luego Protocol 2.
- Falla → skill `bdd`: escribir el `.feature` que la reproduce **antes** de corregir.

## Regla
Una Falla sin pasos de reproducción es una conversación, no un ticket.
