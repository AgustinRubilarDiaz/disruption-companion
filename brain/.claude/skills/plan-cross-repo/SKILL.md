---
name: dc-plan-cross-repo
description: Disruption Companion — plan bottom-up para un cambio que toca más de un componente del monorepo.
---

# Skill: Plan Cross-Componente

> En este monorepo "repo" = componente (`system_topology.json`). Se conserva el nombre del manual.

## Anuncio de fase
Dentro de P2: `▶ [P2 · 3/7 · plan-cross-repo · razonamiento]`
Al esperar: `⏸ [P2 · 3/7 · plan-cross-repo · razonamiento] — esperando aprobación del plan`

## Cuándo ejecutar
El cambio toca más de un componente (ej. lógica de resolución + capa del pasajero), después de
`validate-change`.

## Pasos

### 1. Orden bottom-up
```
contracts/ (tools-api.md dado · disruption-api.md propio)
  → mocks de tools (fixtures)
    → lógica de dominio determinística (políticas, elegibilidad, calidad de datos)
      → orquestación / API (tools de escritura, escalamiento, notificación)
        → capa del pasajero (pantalla o mensaje)
```
Si el track es Frontend, la capa de backend queda como **contrato dado** y el orden empieza en
`disruption-api.md` + mock de esa API.

### 2. Por componente, declarar
- Qué cambia y por qué
- Qué contrato consume y cuál produce
- Qué `.feature` lo valida y con qué comando
- Si queda **implementado** o como **diseño/pseudocódigo** (decisión de alcance)

### 3. Validar el presupuesto
Sumar minutos por componente vs tiempo restante. Si no alcanza, proponer qué baja a diseño.

### 4. Presentar
```
HU:        [ID]
Orden:     1. [componente] — [cambio] — [implementado | diseño] — [min]
           2. …
Contratos: [en qué paso se actualiza cada uno]
Tests:     [comando por componente]
Total:     [min] · restante: [min]
```
**No generar código antes de la aprobación.**
