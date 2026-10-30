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
| Componente | Ruta | Estado |
|---|---|---|
| `disruption-engine` — lógica de resolución + orquestación de tools (mocks) | `engine/` | Planificado (sin código) |
| `passenger-experience` — especificación de mensajes y wireframe | `brain/contracts/passenger-experience.md` | Diseño, por escribir |

## Pendiente
- Contrato propio `contracts/disruption-api.md` antes del primer código.
- Stack: ADR-002.
- IA en runtime (D-03).
