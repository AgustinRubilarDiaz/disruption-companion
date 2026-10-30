# ENH-001 · Bootstrap del Brain

- **Fecha:** 2026-10-29
- **Commit:** _pendiente_

## Problema
Proyecto nuevo (Caso A del desafío) sin estructura para que el agente trabaje con contexto de
dominio, gates y trazabilidad del uso de IA.

## Decisiones
1. **Layout monorepo:** el Brain vive en `brain/` dentro del repo del proyecto, con router
   `CLAUDE.md` en la raíz y `HALLAZGOS.md` en la raíz. Motivo: un solo entregable al comité; el
   vertical slice y la capa complementaria conviven en el mismo repo.
2. **Backlog local** en `brain/backlog/` (markdown) en vez de Jira: no hay gestor para el desafío.
   Los skills conservan el nombre del manual (`jira-to-implementation`) pero leen el backlog local.
3. **Domain Specialist = el usuario**, con el enunciado como fuente primaria. Estados ✅/🟡/❓ en
   la Knowledge Base para distinguir dado / decidido / abierto.
4. **IDs `RN-0X`** para reglas del Brain, distintos de `R1…R5` de la política, para evitar colisión.
5. **Fixtures** del enunciado copiados textualmente a `contracts/fixtures/` como base de mocks.
6. **`operations/ai-usage-log.md`**: agregado al manual porque el Entregable 3 y el límite de 3 h
   lo requieren; `brain-update` lo alimenta.
7. Skills **sin** `security-report`, `gitlab-vulnerability-report` ni `verify-artifact-version`:
   no hay CI ni registry en este proyecto.
8. Los skills globales de MOT (`~/.claude/skills/`) tienen los mismos nombres de carpeta (H-90).
   Mitigación: cada skill de acá declara en su frontmatter un `name` con prefijo `dc-`
   (`dc-bdd`, `dc-brain-update`…), el router los referencia por ruta explícita, y
   `.claude/skills` en la raíz es un symlink a `brain/.claude/skills` para que carguen desde la raíz.

## Alternativas descartadas
- Brain como repo separado: duplica entregables y no aporta en un proyecto de un solo dev.
- `.brain/` (proyecto único): la estructura de contratos y plan cross-componente sí se necesita
  porque habrá dos capas (track + complementaria).
