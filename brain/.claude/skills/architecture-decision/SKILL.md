---
name: dc-architecture-decision
description: Disruption Companion — registra una decisión técnica sin precedente como ADR en brain/architecture/adr/.
---

# Skill: Architecture Decision

## Anuncio de fase
Dentro de P2: `▶ [P2 · 3/7 · architecture-decision · razonamiento]` · fuera: `▶ [architecture-decision · razonamiento]`
Al esperar: `⏸ [architecture-decision · razonamiento] — esperando decisión del usuario`

## Cuándo ejecutar
Hay que tomar una decisión técnica y **no hay precedente** en `architecture/adr/`.
Primer uso esperado: **ADR-001 — elección de track** (D-01 en `HALLAZGOS.md`).

## Pasos

### 1. Verificar precedentes
Leer `architecture/adr/` y la tabla §7 de `GLOBAL_AGENT_CONTEXT.md`.
Si la decisión extiende un ADR, se documenta ahí; si lo contradice, ADR nuevo que lo reemplaza.

### 2. ¿Merece ADR?
Sí, si: elige track o stack; cambia una frontera; decide qué es determinístico, AI-assisted,
agentic o human; introduce una dependencia (un modelo, un framework); asume una deuda a propósito.
No: nombres, refactors internos, agregar un test.

### 3. Escribir el ADR
Copiar `architecture/adr/ADR-000-template.md`, numerar con el siguiente libre.
- **Contexto** — incluir las restricciones reales: 3 h, qué evalúa el comité, RN afectadas.
- **Opciones** — mínimo 2, con a favor y en contra honestos (costo, latencia, riesgo, reversibilidad).
- **Decisión** — y el **criterio que desempató**.
- **Consecuencias** — positivas **y** negativas. Sin costos asumidos, el ADR está incompleto.
- **Clasificación de pasos** si aplica (alimenta la tabla del README de ingeniería).

### 4. La decisión es del usuario
El agente propone y recomienda; **el usuario decide**. Estado `Propuesto` hasta su aprobación.

### 5. Impacto en el Brain
- [ ] ¿Resuelve un hallazgo? → marcarlo en `HALLAZGOS.md`
- [ ] ¿Cambia la topología? → `system_topology.json`, `component_registry.json`, `repo-index.md`
- [ ] ¿Requiere contrato propio? → `contracts/disruption-api.md`
- [ ] ¿Requiere `.feature` nuevo o modificado?
- [ ] Fila en la tabla §7 de `GLOBAL_AGENT_CONTEXT.md`

### 6. Cierre
**Cierre de versionado** con `docs(brain): ADR-00X — <título>`.

## Regla
Un ADR se escribe **al decidir**, no después. Es además material directo para la defensa.
