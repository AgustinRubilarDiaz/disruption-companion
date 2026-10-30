# HU-006 · Recibir una notificación clara y validada

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Media · 10 min (contrato y plantilla)
- **Capacidad:** C3

## Historia
Como pasajero, quiero recibir un aviso con lo que pasó y qué hacer, en lenguaje simple, para decidir
sin llamar.

## Criterios de aceptación
1. Dado el caso base, el mensaje dice: el vuelo LA500 sale a las 17:10, se pierde la conexión LA2410,
   corresponde un cambio sin costo a LA2412 del 16-09 a las 08:15 para ambos pasajeros, y un agente
   contactará por la atención prioritaria.
2. El mensaje se arma desde una plantilla y sólo con hechos de la evaluación: no hay texto que no
   provenga de un dato verificado.
3. El envío incluye `policy_ref`; el texto no incluye `confidence`, nombres de fuentes internas ni
   IDs de regla.
4. Dada la respuesta 202 `QUEUED`, entonces se registra como encolada, no como entregada.
5. **(neg)** Dada una respuesta 422 `UNVALIDATED_CONTENT`, entonces no se reintenta el mismo mensaje,
   se registra como error propio y se deriva.

## Reglas de negocio que toca
- RN-04 (notificación validada) · RN-06

## Componentes y contratos
- Componentes: `engine/` (`domain/message.ts`, `app/orchestrator.ts`)
- Contratos: `tools-api.md` (`notify_passenger`) · `disruption-api.md` (`message`) · `passenger-experience.md` (textos por `template_id`)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Armar el mensaje desde plantilla | determinístico | Sin `policy_ref` no se construye |

## Validación
- `.feature`: `features/EP-01_evaluacion-disrupcion.feature` — caso base
- Tests: `engine/test/unit/domain.test.ts` (buildMessage), `engine/test/unit/orchestrator.test.ts`

| AC | Evidencia |
|---|---|
| 1 | Escenario caso base |
| 3 | `buildMessage`: sin `policy_ref` no se construye · `assessDisruption`: notifica con `policy_ref` |
| 2, 4, 5 | **Sin test identificado** |

## Dependencias y riesgos
- Hoy se notifica en cada evaluación (H-30).

## Preguntas abiertas
- H-02 (qué ve el pasajero) · H-30 (cuándo notificar) · H-32 (canal de contacto)

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
