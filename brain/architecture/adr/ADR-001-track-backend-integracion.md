# ADR-001 · Track Backend/Integración

- **Estado:** Aceptado
- **Fecha:** 2026-10-29
- **Decide:** usuario (Tech Lead / DS)
- **Resuelve:** D-01 (`HALLAZGOS.md`)

## Contexto
El enunciado (§5) pide implementar un vertical slice en **un** track y dejar la capa complementaria
como diseño, contrato o pseudocódigo. Restricciones: 3 h efectivas; el comité evalúa fundamentos
(contratos, estados, errores), confiabilidad y razonamiento agentic y control, y explícitamente
**no** penaliza no terminar la capa complementaria.

## Opciones consideradas
### A. Backend/Integración
- A favor: la pregunta central del caso ("qué le corresponde al pasajero") se demuestra con tests;
  cubre los edge cases E1–E9 (conexión perdida, fuentes contradictorias, menor en el grupo,
  opciones inviables, 503 indeterminado, 422 sin `policy_ref`); los fixtures del enunciado sirven
  de mocks directos para BDD.
- En contra: demo menos visual; la experiencia del pasajero queda como especificación.
### B. Frontend/Experience
- A favor: demo visual; muestra pensamiento de producto sobre qué ve el pasajero (H-02).
- En contra: la resolución del caso pasa a ser un supuesto del contrato; riesgo de lógica de
  negocio en el frontend; poco espacio para idempotencia, conflictos y escalamiento.

## Decisión
**A — Backend/Integración.** Criterio que desempató: el enunciado pide "determinar qué ocurrió y
qué corresponde"; sólo el backend permite **demostrarlo con tests** en vez de asumirlo.

## Consecuencias
- Positivas: evidencia verificable sobre las reglas RN-01…RN-06; el agente queda acotado a lógica
  determinística testeable.
- Negativas / costos asumidos: la capa del pasajero se entrega como especificación de mensajes y
  wireframe (no implementada); la defensa necesita apoyarse en tests y trazas, no en una UI.
- Reversibilidad: alta. El contrato propio (`contracts/disruption-api.md`) es el mismo que
  consumiría un frontend futuro.

## Componentes resultantes
| Componente | Ruta | Estado al decidir (2026-10-29) | Estado actual |
|---|---|---|---|
| `disruption-engine` — lógica de resolución + orquestación de tools (mocks) | `engine/` | Planificado (sin código) | Implementado · POC `v0.1.0-poc` |
| `passenger-experience` — especificación de mensajes y wireframe | `brain/contracts/passenger-experience.md` | Diseño, por escribir | Escrita |
| `passenger-web` — pantalla del pasajero | `web/` | No previsto | Implementado (ADR-010, UX-01) |

## Enmienda 2026-10-30 — la capa complementaria se implementó
El track sigue siendo **Backend/Integración**: la profundidad (tests, invariantes, idempotencia,
derivación) está en `engine/`. Con el tiempo que sobró se implementó la pantalla en `web/` (ADR-010),
que consume el mismo contrato sin lógica de negocio. La consecuencia negativa de arriba ("la capa
del pasajero se entrega como especificación, no implementada") ya no aplica; la defensa sigue
apoyándose en los tests y las trazas del motor.

## Pendiente
- ~~Contrato propio `contracts/disruption-api.md` antes del primer código.~~ Hecho.
- ~~Stack: ADR-002.~~ Hecho.
- ~~IA en runtime (D-03).~~ Hecho: ADR-009.
