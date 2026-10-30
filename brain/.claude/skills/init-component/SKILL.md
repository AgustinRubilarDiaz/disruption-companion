---
name: dc-init-component
description: Disruption Companion — genera el CLAUDE.md de un componente nuevo del monorepo y lo registra en la topología.
---

# Skill: Init Component

## Anuncio de fase
`▶ [init-component · ejecución]`
Al esperar: `⏸ [init-component · ejecución] — esperando aprobación del CLAUDE.md`

## Cuándo ejecutar
Se crea un componente nuevo (ej. el vertical slice después de ADR-001) y todavía no tiene `CLAUDE.md`.

## Pasos

### 1. Leer el componente
Abrir su punto de entrada y sus archivos de build. El **stack se verifica en el build**
(`package.json`, `pyproject.toml`, etc.), nunca en un README ni deducido del nombre.

### 2. Generar desde la plantilla
`templates/componente.md` → `<ruta-del-componente>/CLAUDE.md`. Sólo lo propio del componente:
responsabilidad, qué **NO** debe hacer, stack real, comandos, reglas críticas con ✅/❌, checklist.
Todo lo transversal se **referencia** al Brain, no se copia.

### 3. Registrar
- `architecture/system_topology.json` (con `dependsOn`)
- `architecture/component_registry.json`
- `architecture/repo-index.md` (y el contador)
- `architecture/diagrams.md` si cambia la vista de contexto

### 4. Mostrar y esperar aprobación
Luego **Cierre de versionado**.

## Regla
Si una regla del `CLAUDE.md` del componente ya está en el Brain, borrarla del componente.
