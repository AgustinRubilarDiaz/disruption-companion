---
name: dc-e2e-closure
description: Disruption Companion — gate técnico pre-entrega (momento 1) y preparación de la defensa ante el comité (momento 2).
---

# Skill: E2E Closure

## Anuncio de fase
Momento 1: `▶ [P2 · 5/7 · e2e-closure · razonamiento]` (HU) o `▶ [P3 · 4/5 · e2e-closure · razonamiento]` (bug)
Versionado: `▶ [P2 · 6/7 · versionado · razonamiento]`
Momento 2: `▶ [P2 · 7/7 · e2e-closure · razonamiento]`
En el gate: `⏸ [P2 · 7/7 · e2e-closure · razonamiento] — esperando aprobación del usuario`

---

## Momento 1 — Gate técnico pre-entrega

### Checklist — sin aprobación no se cierra la HU
**Código**
- [ ] Los escenarios del `.feature` aprobado pasan (comando y resultado)
- [ ] Tests y linter del componente en verde
- [ ] Las instrucciones para ejecutarlo funcionan desde cero

**Reglas de dominio**
- [ ] Toda recomendación cita `policy_ref` + `rule_id` de la versión vigente (RN-01)
- [ ] Ninguna opción candidata se ofrece sin filtrar (RN-02)
- [ ] Escrituras de alto impacto: idempotency key, 409 y 503 manejados, control humano (RN-03)
- [ ] Nada sin validar llega al pasajero (RN-04)
- [ ] Datos con fuente, timestamp y completeness (RN-05)
- [ ] Sin PII en logs, evidencia innecesaria ni prompts (RN-06)
- [ ] Ningún hallazgo abierto se implementó como si estuviera decidido

**Contratos**
- [ ] Mocks respetan `contracts/tools-api.md`
- [ ] `contracts/disruption-api.md` actualizado si cambió la API propia

**Evidencia para los entregables**
- [ ] Uso de IA y tiempo registrados en `operations/ai-usage-log.md`
- [ ] Limitaciones conocidas anotadas (van al Entregable 1)

### Cierre de versionado
Con el checklist aprobado: **Cierre de versionado** de `brain/CLAUDE.md`. La sección "Validación"
del commit se completa con este checklist.

---

## Momento 2 — Preparación de la defensa (10 min + debate)

**1. Verificar los entregables** contra el enunciado §6:
- Entregable 1: track y por qué · cómo ejecutarlo · alcance · tests · limitaciones · capa complementaria
- Entregable 2 (≤ 2 págs.): problema y outcome · supuestos y alcance · decisiones y descartes ·
  clasificación determinístico/AI-assisted/agentic/human · riesgos y próximos pasos · validación
- Entregable 3 (≤ 1 pág.): herramientas de IA · outputs aceptados/rechazados/modificados y cómo se
  validaron · decisiones personales · qué nunca se entrega a un modelo

**2. Guion de 10 minutos**: cómo se entendió el problema → estructura → decisiones y supuestos →
criterios → trade-offs. En lenguaje de negocio, happy path primero y bordes después.

**3. Preparar el debate**: por cada ADR, la alternativa descartada y qué la haría ganar; por cada
hallazgo abierto, qué se preguntaría y a quién. Escenarios probables: fuente nueva contradictoria,
503 en rebooking, grupo con menor, qué cambiaría con IA en runtime.

**4. Declarar lo que NO se hizo**, con honestidad explícita.

**5. Gate:** el usuario aprueba. Luego `maintenance/brain-update`.

## Regla
Un gate que se salta una vez deja de ser gate. Si un ítem no aplica, decir por qué.
