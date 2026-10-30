# Disruption Companion — Brain del Agente

> Sos el agente técnico del equipo **Disruption Companion** (Caso A del desafío técnico
> Software Engineer Senior · Digital & Data). Este directorio es el **harness**: la fuente de verdad
> del producto. Leé este archivo completo antes de actuar. No improvises reglas de negocio.

---

## ¿Cómo empezar?

### Tengo una idea nueva sin HU
1. Leé `GLOBAL_AGENT_CONTEXT.md` y `KNOWLEDGE_BASE.md`
2. Ejecutá `.claude/skills/feature-discovery/`

### Tengo una HU del backlog para implementar
1. Leé `GLOBAL_AGENT_CONTEXT.md` y `KNOWLEDGE_BASE.md`
2. Ejecutá `.claude/skills/jira-to-implementation/` (lee la HU desde `backlog/`)

### Voy a hacer un cambio que toca más de un componente
1. Leé `architecture/system_topology.json` y `contracts/`
2. Ejecutá `.claude/skills/validate-change/` y luego `.claude/skills/plan-cross-repo/`

### Encontré un bug
1. Leé `operations/triage.md`
2. Ejecutá `.claude/skills/create-tasks/` (tipo Falla)
3. Escribí el `.feature` que lo reproduce antes de corregir: `.claude/skills/bdd/`

### Terminé una sesión
Escribí **"cerramos"** → el agente ejecuta `.claude/skills/maintenance/brain-update/`.

---

## Mapa de conocimiento

| Necesito saber sobre… | Leo en… |
|---|---|
| Objetivo, restricciones del desafío, topología, fronteras | `GLOBAL_AGENT_CONTEXT.md` |
| Producto: negocio, objetivo, valor, métricas, funcionalidades, flujo | `../Docs/` (versión canónica) · `product/` (copia de trabajo) |
| AS-IS / TO-BE e impacto financiero · reglas RB/RD/RS consolidadas · inventario de sistemas | `../Docs/10`, `../Docs/11`, `../Docs/12` |
| Cómo se consume cada tool (validaciones, errores, idempotencia) | `contracts/logica-contratos.md` |
| Reglas de negocio, edge cases | `KNOWLEDGE_BASE.md` |
| Una regla concreta en detalle | `domain/rules/RN-0X-*.md` |
| Términos del dominio (booking, segmento, entitlement…) | `domain/ubiquitous-language.md` |
| Contratos de las tools y de la API propia | `contracts/` |
| Datos de ejemplo del enunciado (para mocks y tests) | `contracts/fixtures/` |
| Decisiones técnicas | `architecture/adr/` |
| Diagramas de contexto y flujos | `architecture/diagrams.md` |
| Qué fuente creer ante un conflicto | `architecture/fuentes-externas.md` |
| Qué hace cada componente | `architecture/repo-index.md` · `system_topology.json` |
| Épicas, HU, fallas y deuda técnica | `backlog/` |
| Comportamiento esperado | `features/*.feature` |
| Diagnóstico de errores | `operations/triage.md` |
| Registro de uso de IA (insumo del Entregable 3) | `operations/ai-usage-log.md` |
| Modelo por fase | `operations/modelos.md` |
| Historial de mejoras del harness | `enhancements/` |
| Lo que todavía no se sabe | `../HALLAZGOS.md` |

---

## Reglas que siempre aplican

1. **Plan de impacto antes de código.** Declarar componentes afectados, contratos tocados, si
   requiere ADR, y esperar confirmación.
2. **Respetá las fronteras** de `GLOBAL_AGENT_CONTEXT.md` §4. El frontend no lleva lógica de negocio.
3. **Contrato primero.** Cambio de esquema o de API → actualizar `contracts/` antes que el código.
4. **No inventes reglas de dominio.** Si no está en `KNOWLEDGE_BASE.md` ni en `domain/rules/`,
   es un vacío: registralo en `HALLAZGOS.md` y preguntá. Las ambigüedades del enunciado (§4 del PDF)
   **las decide el usuario**, no el agente: proponé opciones, no las asientes como regla.
5. **Si hay ambigüedad de negocio: una sola pregunta** antes de continuar.
6. **Las acciones de alto impacto nunca se automatizan sin control** (RN-03). Ante la duda,
   el diseño escala a humano.
7. **Datos personales:** nada de PII del pasajero en logs, prompts a modelos ni fixtures nuevos
   inventados con datos reales (RN-06).
8. **Versiones: verificar en el build** (`package.json`, `pyproject.toml`, `build.gradle`,
   `Dockerfile`), nunca en un README.
9. **Decisión de arquitectura** → `architecture/adr/`. **Mejora del harness** → `enhancements/`.
10. **Sin `.feature` aprobado, sin código.** Sin excepción por "fix simple".
11. **Anunciá la fase:** `▶ [P2 · 2/7 · bdd · razonamiento]`; al pausar:
    `⏸ [P2 · 2/7 · bdd · razonamiento] — esperando aprobación del .feature`; fuera de un
    protocolo: `▶ [nombre-skill · perfil]`. Cada `SKILL.md` declara su anuncio.
12. **Presupuesto de tiempo:** el desafío permite máximo 3 h efectivas. Al iniciar cada protocolo,
    recordá cuánto lleva consumido según `operations/ai-usage-log.md` y priorizá en consecuencia.
13. **Registrá el uso de IA.** Cada output de IA aceptado, rechazado o modificado de forma relevante
    va a `operations/ai-usage-log.md` (lo exige el Entregable 3).
14. **Mantené el CWD en la raíz del proyecto.** Editá con rutas absolutas; nunca `cd` a un subdirectorio.
15. **Todo flujo termina con el Cierre de versionado.** Nunca crear rama, commitear ni pushear
    sin aprobación explícita.
16. **Formato de commit del Brain:** `docs(brain): descripción`.

---

## Cierre de versionado

Al final de cualquier flujo que haya modificado archivos (si no modificó nada, decirlo y omitir):

1. **Proponer la rama** desde `main`: `feature/<HU-XXX>`, `fix/<FALLA-XXX>`, `chore/<DT-XXX>`;
   cambios sólo del Brain: `docs/brain-<slug>` o la rama actual si el usuario lo indica.
2. **Mostrar el commit completo:**

```
<tipo>(<ID>): <resumen en imperativo, máx. 72 caracteres>

Qué se hizo:
- <cambio concreto, con archivo o componente>

Por qué:
- <regla de negocio, bug o decisión que lo motiva>

Validación:
- .feature: <archivo> — <escenarios y resultado>
- Tests: <comando y resultado>
- Gate e2e-closure: <OK, o ítems no aplicables y por qué>

Ticket: <ID>
```

3. `⏸ [P{n} · {fase}/{total} · versionado · razonamiento] — esperando aprobación de rama y commit`
4. Crear rama y commitear sólo con aprobación.
5. `⏸ … — ¿hacemos push de <rama> a origin?` (si no hay remote configurado, decirlo).
6. Si hay ticket: mostrar la entrada exacta que se agrega a la sección **Historial** del archivo
   de la HU en `backlog/` y preguntar antes de escribirla. No cambiar su estado sin pedido.

---

## Modelo por fase (opcional)

La sesión principal corre con perfil **razonamiento** (analizar, planificar, gates). La
implementación (P2 fase 4, P3 fase 3) puede delegarse **con aprobación** al subagente
`agents/implementador.md` con el modelo de `operations/modelos.md`. Requisitos: plan aprobado y
`.feature` aprobado. Los gates nunca se delegan. Sin aprobación, se implementa en la sesión principal.

---

## Skills disponibles (`brain/.claude/skills/`)

| Skill | Cuándo usarlo |
|---|---|
| `feature-discovery/` | Idea → épicas y HU en `backlog/` |
| `create-tasks/` | Crear una HU, Falla o deuda técnica en `backlog/` |
| `jira-to-implementation/` | HU → plan de impacto (el nombre se conserva del manual; el gestor es `backlog/`) |
| `bdd/` | HU con ACs → escenarios Gherkin |
| `validate-change/` | Antes de un cambio con impacto en otro componente o contrato |
| `plan-cross-repo/` | Cambio que toca más de un componente |
| `architecture-decision/` | Decisión técnica sin precedente |
| `e2e-closure/` | Gate pre-entrega y preparación de la defensa ante el comité |
| `init-component/` | Generar el `CLAUDE.md` de un componente nuevo |
| `maintenance/brain-update/` | Al cerrar cualquier sesión |

---

## Protocolos de trabajo

- **Protocol 1 — Idea → Backlog** (4 fases): 1. contexto · 2. `feature-discovery` ·
  3. sign-off del usuario ← **gate** · 4. cada HU al P2 → Cierre de versionado.
- **Protocol 2 — HU → DONE** (7 fases): 1. `jira-to-implementation` · 2. `bdd` ← **gate** ·
  3. ADR / `plan-cross-repo` (si aplica) · 4. implementar (`ejecución`, delegable) ·
  5. `e2e-closure` momento 1 ← **gate** · 6. Cierre de versionado ·
  7. `e2e-closure` momento 2 → `brain-update`.
- **Protocol 3 — Bug aislado** (5 fases): 1. `create-tasks` (Falla) · 2. `bdd` que reproduce ←
  **gate** · 3. fix (`ejecución`, delegable) · 4. `e2e-closure` momento 1 + Cierre de versionado ·
  5. validación del usuario si toca negocio → `brain-update`.
