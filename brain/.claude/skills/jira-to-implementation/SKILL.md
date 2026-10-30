---
name: dc-jira-to-implementation
description: Disruption Companion — lee una HU de brain/backlog/ y produce el plan de impacto (Protocol 2, fase 1).
---

# Skill: HU → Implementación

> Conserva el nombre del manual; en este proyecto el gestor de tickets es `brain/backlog/`.

## Anuncio de fase
Al arrancar: `▶ [P2 · 1/7 · jira-to-implementation · razonamiento]`
Al esperar: `⏸ [P2 · 1/7 · jira-to-implementation · razonamiento] — esperando aprobación del plan de impacto`

## Cuándo ejecutar
Hay una HU `Aprobada` en `backlog/` con ACs. Paso 1 del **Protocol 2**.

## Pasos

### 1. Leer la HU
`backlog/HU-XXX-*.md`. Si no está `Aprobada`, detenerse: falta el sign-off (Protocol 1).

### 2. Leer el Brain
`GLOBAL_AGENT_CONTEXT.md` (fronteras, ADRs), `KNOWLEDGE_BASE.md`, las `domain/rules/` citadas,
`contracts/`, `HALLAZGOS.md`.

### 3. Declarar lo que falta
- ACs ambiguos o contradictorios.
- Hallazgos abiertos de los que depende → **no** asumir su resolución.
- **Si hay ambigüedad de negocio: una sola pregunta.**

### 4. Owner de aceptación
Usuario como **DS** si toca reglas de negocio; como **Tech Lead** si es puramente técnico.

### 5. Mapear componentes y controles
Consultar `architecture/system_topology.json`. Preguntas de control:
- ¿Llama a una tool de **escritura**? → RN-03 / RN-04: idempotencia, 503, aprobación humana.
- ¿Usa datos operacionales? → RN-05: fuente, timestamp, frescura, completeness.
- ¿Muestra o registra datos del pasajero? → RN-06.
- ¿Algún paso usa IA? → declarar por qué, qué contexto recibe (sin PII) y cómo se detecta un
  output incorrecto.
- ¿El frontend necesita lógica? Probablemente va en el backend.
- ¿Crea o cambia una API propia? → `contracts/disruption-api.md` primero.

### 6. Presupuesto
Estimar minutos y compararlos con el tiempo restante (`operations/ai-usage-log.md`).

### 7. Presentar el plan y esperar confirmación
```
HU:            [ID] — [título]
Owner acept.:  [DS | Tech Lead]
Componentes:   [qué cambia en cada uno]
Contratos:     [cuáles, o "ninguno"]
¿Requiere ADR? [sí/no + por qué]
Reglas:        [RN-0X, POL-DELAY-2026-03/RX]
Clasificación: [paso → determinístico / AI-assisted / agentic / human]
Riesgos:       [qué puede salir mal]
Pendiente:     [H-XX abiertos]
Estimación:    [min] · restante: [min]
Orden:         [1..n]
```
**No generar código antes de la confirmación.**

### 8. Siguiente paso
Skill `bdd`.
