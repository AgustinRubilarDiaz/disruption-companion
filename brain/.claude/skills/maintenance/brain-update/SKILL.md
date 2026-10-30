---
name: dc-brain-update
description: Disruption Companion — actualiza el Brain al cerrar una sesión ("cerramos", "fin de sesión").
---

# Skill: Brain Update

## Anuncio de fase
Al cierre de un protocolo: `▶ [P2 · 7/7 · brain-update · razonamiento]` o `▶ [P3 · 5/5 · brain-update · razonamiento]`
Por "cerramos" fuera de un protocolo: `▶ [brain-update · razonamiento]`
Al esperar: `⏸ [brain-update · razonamiento] — esperando aprobación de los cambios al Brain`

## Cuándo ejecutar
Al terminar cualquier sesión. Se activa con **"cerramos"**, "fin de sesión" o equivalente.

## Pasos

### 1. Revisar la sesión
Responder explícitamente:
- ¿Se **resolvió un hallazgo** de `HALLAZGOS.md` (ambigüedad decidida por el usuario)?
- ¿Apareció una **regla de negocio** o un **edge case** nuevo?
- ¿Se tomó una **decisión de arquitectura**? ¿Cambió un **contrato**?
- ¿Apareció una **pregunta abierta** nueva?
- ¿Se usó IA de forma relevante (output aceptado, rechazado o corregido)?
- ¿Cuánto **tiempo efectivo** se consumió?

Si todo es NO: decirlo y terminar. **No inventar actualizaciones.**

### 2. Proponer cambios concretos (archivo + texto exacto)

| Hallazgo | Destino |
|---|---|
| Ambigüedad resuelta | `KNOWLEDGE_BASE.md` (🟡, cita la decisión) + marcar **Resuelto → destino** en `HALLAZGOS.md` |
| Regla nueva | `KNOWLEDGE_BASE.md` §1 + `domain/rules/RN-0X-*.md` |
| Término nuevo | `domain/ubiquitous-language.md` |
| Decisión técnica | `architecture/adr/ADR-00X-*.md` + tabla §7 de `GLOBAL_AGENT_CONTEXT.md` |
| Contrato | `contracts/*.md` |
| Edge case | `KNOWLEDGE_BASE.md` §2 + el `.feature` correspondiente |
| Componente nuevo | `system_topology.json` + `component_registry.json` + `repo-index.md` |
| Pregunta abierta | `HALLAZGOS.md` |
| Uso de IA / tiempo | `operations/ai-usage-log.md` |
| Mejora del harness | `enhancements/ENH-00X-*.md` |

### 3. Esperar confirmación
**No escribir ni commitear sin aprobación.** Mostrar el diff propuesto.

### 4. Commit
Agregar la entrada al **Changelog** de `GLOBAL_AGENT_CONTEXT.md` y ejecutar el **Cierre de
versionado** de `brain/CLAUDE.md` con encabezado `docs(brain): <descripción>`.

## Reglas
- Sólo documentar lo que no es obvio en el código.
- Si algo nuevo contradice una regla existente: señalarlo y preguntar cuál vale.
- Lo que viene de una suposición va a `HALLAZGOS.md`, nunca a la Knowledge Base.
