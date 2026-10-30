---
name: dc-feature-discovery
description: Disruption Companion — convierte una idea o capacidad en épicas e HU con ACs en brain/backlog/ (Protocol 1).
---

# Skill: Feature Discovery

## Anuncio de fase
Al arrancar: `▶ [P1 · 2/4 · feature-discovery · razonamiento]`
En el gate: `⏸ [P1 · 3/4 · sign-off · razonamiento] — esperando aprobación del backlog`

## Cuándo ejecutar
Hay una idea o capacidad sin HU. Paso 2 del **Protocol 1**.

## Entrada
Descripción de la iniciativa en lenguaje de negocio.

## Salida
Épicas e HU en `backlog/` (plantillas en `backlog/_templates/`), en estado `Borrador`.

## Pasos

### 1. Leer el Brain
`GLOBAL_AGENT_CONTEXT.md` (objetivos de la V1, restricciones del desafío, qué evalúa el comité),
`KNOWLEDGE_BASE.md`, `HALLAZGOS.md`, `contracts/tools-api.md`, `architecture/adr/`.

### 2. Ubicar la iniciativa
- ¿Cuál de los **4 objetivos de la V1** cubre? Si ninguno, decirlo: puede estar fuera de alcance.
- ¿Cae en el **track elegido** (ADR-001) o en la capa complementaria (diseño/contrato)?
  Si ADR-001 sigue pendiente, señalarlo: las HU de implementación dependen de esa decisión.

### 3. Detectar conflictos y vacíos
- ¿Contradice alguna RN-0X?
- ¿Depende de un hallazgo abierto (H-XX)? Listarlo en la HU; **no** resolverlo por cuenta propia.
- ¿Implica una acción de alto impacto (RN-03) o mostrar datos al pasajero (RN-04, RN-06)?

### 4. Estructurar el backlog
Una **épica** por capacidad. Dentro, **HU verticales** que entregan valor observable.
Por cada HU: título de negocio, ACs verificables, RN tocadas, componentes y contratos,
clasificación de pasos (determinístico / AI-assisted / agentic / human), riesgos, dependencias,
y **estimación en minutos** contra el presupuesto de 3 h.

### 5. Priorizar contra el tiempo
Sumar las estimaciones. Si superan el tiempo restante (`operations/ai-usage-log.md`), proponer
qué queda como diseño/pseudocódigo. El comité valora criterio sobre volumen.

### 6. Declarar lo que no se sabe
Preguntas que el usuario debe responder **antes** de implementar → `HALLAZGOS.md`.

### 7. Escribir en `backlog/`
Épica primero, luego HU enlazadas; actualizar el índice de `backlog/README.md`.

### 8. Gate — sign-off del usuario
El usuario revisa y aprueba (estado → `Aprobada`). Sin aprobación no se avanza.

### 9. Siguiente paso
Cada HU aprobada entra al **Protocol 2** (`jira-to-implementation`).
Al terminar: **Cierre de versionado** (`brain/CLAUDE.md`).

## Reglas
- Prefiero una pregunta hoy que una regla inventada en el código.
- Si una HU implica escritura de alto impacto, decirlo en su primer párrafo.
