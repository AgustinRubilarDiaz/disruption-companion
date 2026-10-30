---
name: dc-bdd
description: Disruption Companion — convierte los ACs de una HU (o un bug) en escenarios Gherkin en español en brain/features/.
---

# Skill: BDD

## Anuncio de fase
Al arrancar: `▶ [P2 · 2/7 · bdd · razonamiento]` (HU) o `▶ [P3 · 2/5 · bdd · razonamiento]` (bug)
En el gate: `⏸ [P2 · 2/7 · bdd · razonamiento] — esperando aprobación del .feature`

## Cuándo ejecutar
HU con ACs y todavía sin código. También para reproducir un bug **antes** de corregirlo.

## Salida
`brain/features/<ID>_<slug>.feature`, Gherkin **en español** (`# language: es`).

## Pasos

### 1. Leer el contexto
`KNOWLEDGE_BASE.md`, las `domain/rules/` que toca la HU, `domain/ubiquitous-language.md`,
`features/` existentes (reutilizar frases), `contracts/fixtures/` (datos de los escenarios).

### 2. Escribir los escenarios, en este orden
1. **Happy path** — preferir el caso base del enunciado (booking `ABC123`).
2. **Errores de las tools** — por código: 409, 503, 422, `PARTIAL`, fuente degradada.
3. **Edge cases** de `KNOWLEDGE_BASE.md` §2 (E1…E9) que la HU toque.
4. **Controles** — cuándo se detiene y escala a humano; qué **no** se envía al pasajero.

### 3. Convenciones
- `# language: es` en la primera línea; `Característica`, `Antecedentes`, `Escenario`,
  `Esquema del escenario` + `Ejemplos` para variantes de una misma regla.
- Etiquetas: `@HU-XXX`, `@RN-0X`, `@happy-path`, `@error`, `@edge`, `@humano`, `@seguridad`,
  `@pendiente`, `@bug-conocido`.
- Citar la política con versión: `según POL-DELAY-2026-03/R3`.
- Datos: los de `contracts/fixtures/`. Sin PII nueva ni datos reales (RN-06).
- Un comentario `#` debajo del escenario si documenta un punto abierto o una deuda aceptada.

### 4. Marcar lo que no se sabe
Si el comportamiento depende de un hallazgo abierto (H-XX), **no inventarlo**: etiquetar
`@pendiente`, comentar `# depende de H-XX` y llevar la pregunta al gate.

### 5. Gate — sign-off del usuario
**El `.feature` no es spec hasta que el usuario lo aprueba.** Sin aprobación, no se implementa.

## Reglas
- El `.feature` aprobado es la spec. El código se escribe para que pase, no al revés.
- Para un bug, el escenario debe **fallar hoy**.
- Cada escenario debe poder ejecutarse como test automatizado del track elegido.
