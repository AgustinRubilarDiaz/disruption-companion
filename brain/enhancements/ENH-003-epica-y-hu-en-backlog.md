# ENH-003 · La épica y las HU pasan al backlog del Brain

- **Fecha:** 2026-10-30
- **Decide:** usuario
- **Commit:** _pendiente_

## Problema
EP-01 y sus 10 HU vivían en un solo documento, `Docs/epica/EP-01-…md`, y el backlog del Brain sólo
lo apuntaba. Los skills `create-tasks`, `jira-to-implementation`, `bdd` y `e2e-closure` esperan
`backlog/HU-XXX-*.md`, así que no podían operar por HU. Además, `brain/product/README.md` declaraba
que `Docs/` manda sobre el Brain, al revés de lo que pide el manual.

## Decisiones
1. **El Brain es la fuente de verdad**; `Docs/` es la copia limpia para el comité, derivada del Brain.
2. **Un archivo por HU** (`backlog/HU-001…HU-010`) y uno para la épica (`backlog/EP-01-…`).
3. El contenido de la épica se reparte según su naturaleza:
   - backlog (descripción, alcance, métricas, HU, mapa de ruta, definición de terminado) → `backlog/`;
   - estados del viaje y siguiente paso → `domain/ubiquitous-language.md`;
   - supuestos P-XX → `HALLAZGOS.md`, con la numeración H-XX del Brain (mismo número);
   - mapa de ADR → tabla de la épica con los números reales (la IA en runtime es ADR-009, no ADR-002).
4. Cada HU agrega una sección **Validación** que cruza cada criterio con el escenario o test que lo
   cubre (por nombre de test) y declara los criterios **sin test identificado**. La plantilla
   `_templates/hu.md` incorpora esa sección.
5. Estados iniciales asignados por la migración según `b204ab7`: Pre-entrega (gate `e2e-closure`
   pendiente) y HU-009 en Borrador (diseño). El usuario los confirma.

## Hallazgos de la migración
- Criterios sin test identificado en HU-001 a HU-008 (detalle en cada HU). Bloquea el punto 2 de la
  definición de terminado de EP-01.
- HU-003 AC 7: falla de `get_policy_rules` devuelve 500 (H-29).
- HU-007 AC 3: la clave de idempotencia usa `passenger_count`, no `passenger_ids`.

## Pendiente (Fase B)
- Dar vuelta `brain/product/README.md` ("Docs manda") y traer al Brain lo que sólo vive en `Docs/`
  (10 a 14 y 16).
- Regenerar `Docs/epica/EP-01-…md` desde el backlog (hoy está desactualizada en numeración de ADR y estados).
- Unificar P-XX → H-XX y RD-XX → RN-XX.

## Alternativas descartadas
- Épica completa en un solo archivo dentro de `backlog/`: los skills no podrían operar por HU.
- Dejar el backlog apuntando a `Docs/`: mantiene la fuente de verdad fuera del Brain.
