# Disruption Companion — Workspace

> Este archivo es sólo el **router**. El conocimiento vive en el Brain (`brain/`).
> No agregues reglas acá: se desincronizan.

## Este proyecto NO es MOT / SSLATAM

Si en tu contexto aparece el `CLAUDE.md` de MOT / Contingencia (`~/CLAUDE.md`) o skills de
`~/.claude/skills/`, **no aplican a este workspace**: son de otro proyecto. Acá mandan
`brain/CLAUDE.md` y los skills de `brain/.claude/skills/` (leelos por su ruta explícita).

## Primer paso, siempre
Leé `brain/CLAUDE.md` antes de actuar.

## Ruteo rápido por intención

| Querés…                              | Empezá por                                              |
|--------------------------------------|---------------------------------------------------------|
| Convertir una idea en épicas / HU    | `brain/.claude/skills/feature-discovery/SKILL.md`       |
| Crear una HU, falla o deuda técnica  | `brain/.claude/skills/create-tasks/SKILL.md`            |
| Implementar una HU del backlog       | `brain/.claude/skills/jira-to-implementation/SKILL.md`  |
| Escribir escenarios BDD              | `brain/.claude/skills/bdd/SKILL.md`                     |
| Tomar una decisión técnica           | `brain/.claude/skills/architecture-decision/SKILL.md`   |
| Corregir un bug                      | `brain/operations/triage.md`                            |
| Cambio que toca 2+ componentes       | `brain/.claude/skills/validate-change/SKILL.md`         |
| Cerrar la sesión                     | escribí **"cerramos"**                                  |

## Fuera del Brain
- `Docs/Disruption_Companion.pdf` — enunciado original del desafío (fuente primaria de negocio).
- `Docs/` — copia para el comité, generada desde el Brain con `brain/operations/sync-docs.sh`
  (`brain/product/`, `brain/contracts/logica-contratos.md`, `brain/contracts/disruption-assessment.md` y
  `brain/backlog/` → `Docs/epica/`). **El Brain manda:** se edita en el Brain y se regenera.
  Sólo viven en `Docs/`: 09 (resumen de `HALLAZGOS.md`), 15, 17, 18 y 19.
- `HALLAZGOS.md` — lo que todavía NO se sabe: preguntas abiertas, supuestos, deuda.
