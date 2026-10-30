# HU-009 · Entender una consulta escrita en lenguaje libre (diseño)

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Borrador (diseño, no se implementa en la POC)
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Baja · 10 min (diseño)
- **Capacidad:** §5.2 del enunciado (consulta ambigua o compleja)

## Historia
Como pasajero, quiero escribir mi duda con mis palabras ("¿pierdo la conexión? quiero que me
compensen"), para no tener que adivinar qué opción elegir.

## Criterios de aceptación (del diseño)
1. La consulta se traduce a intenciones de un catálogo cerrado (revisar estado, revisar conexión,
   pedir compensación, hablar con una persona).
2. La intención "pedir compensación" activa `compensation_requested = true`, y R4 lleva el caso a una persona.
3. El componente que interpreta no decide entitlements ni llama a sistemas de escritura.
4. Al modelo no se le envían datos personales: sólo el texto del pasajero, y se enmascaran correos,
   teléfonos y documentos antes de enviarlo.
5. **(neg)** Si no se reconoce la intención con seguridad, se muestran opciones cerradas o se deriva;
   nunca se adivina.

## Reglas de negocio que toca
- RN-06 · `POL-DELAY-2026-03/R4` · ADR-009 (sin IA en runtime en la POC)

## Componentes y contratos
- Componentes: ninguno implementado. Sería un intérprete de intención delante de `engine/`.
- Contratos: por definir (catálogo de intenciones)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Interpretar la intención | AI-assisted | Catálogo cerrado; baja confianza → opciones cerradas o humano |
| Decidir entitlements | determinístico | El intérprete no decide |

## Validación
- No aplica: diseño. Se entrega como especificación.

## Dependencias y riesgos
- ADR-009 decidió no usar IA en runtime; esta HU documenta dónde aportaría y con qué controles.

## Preguntas abiertas
- H-14 (origen de `compensation_requested`)

## Historial
- 2026-10-29 — definida en `Docs/epica/EP-01` (citaba "ADR-002"; la decisión quedó en ADR-009).
- 2026-10-30 — migrada al backlog del Brain (ENH-003).
