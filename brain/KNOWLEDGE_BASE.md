# Knowledge Base — Disruption Companion

> ⚠️ Fuente de verdad de las reglas de negocio. El agente la consulta antes de proponer lógica de dominio.
> **Domain Specialist:** el usuario (candidato), con el enunciado (`../Docs/Disruption_Companion.pdf`)
> como fuente primaria. Glosario: `domain/ubiquitous-language.md`.

**Estado de cada regla**
- ✅ **Dada** — está explícita en el enunciado. No se discute; se implementa.
- 🟡 **Decidida** — ambigüedad resuelta por el usuario y registrada (cita la decisión/ADR).
- ❓ **Abierta** — vive en `../HALLAZGOS.md`, **no** acá. El agente no la implementa como regla.

> Los IDs `RN-0X` son reglas de este Brain. Los IDs `R1…R5` pertenecen a la política
> `POL-DELAY-2026-03` y se citan siempre con su versión: `POL-DELAY-2026-03/R3`.

---

## 1. Reglas de negocio

### RN-01 · La política vigente determina el entitlement ✅
**Qué dice:** lo que le corresponde al pasajero sale de `get_policy_rules(scenario)`, que es
versionada. Para DELAY rige `POL-DELAY-2026-03` (desde 2026-03-01); `POL-DELAY-2025-11` está superseded.
**Cómo se aplica:** toda recomendación cita la versión y el `rule_id` que la sustentan.
Detalle y tabla de reglas: `domain/rules/RN-01-politica-vigente.md`.

### RN-02 · Las opciones elegibles son candidatas, no decisiones ✅
**Qué dice:** `get_eligible_options` entrega candidatas con `confidence` y `ttl_seconds`.
**Cómo se aplica:** cada opción se contrasta contra la política, el grupo y la vigencia antes de
ofrecerla. Detalle: `domain/rules/RN-02-opciones-candidatas.md`.

### RN-03 · Acciones de alto impacto bajo control ✅
**Qué dice:** cambiar una reserva o emitir una compensación son de alto impacto. Una recomendación
incorrecta genera costo, reclamo o incumplimiento de política.
**Cómo se aplica:** idempotency key obligatoria; 409 = ya existe; **503 = resultado indeterminado**
(no reintentar a ciegas); reglas con `requires_human_approval: true` pasan por humano.
🟡 Clave `sha256(booking|option|policy_ref|passenger_count)` (ADR-006; H-36); tras un 503, 2 reintentos con la misma clave y
luego `CONFIRMING` + caso humano (H-12, decidido 2026-10-29).
Detalle: `domain/rules/RN-03-acciones-alto-impacto.md`.

### RN-04 · Nada no validado llega al pasajero ✅
**Qué dice:** `notify_passenger` no debe enviar información no validada; rechaza con 422
`UNVALIDATED_CONTENT` si falta `policy_ref`. Detalle: `domain/rules/RN-04-notificacion-validada.md`.

### RN-05 · Datos operacionales: fuente, timestamp y frescura ✅
**Qué dice:** los datos pueden estar desactualizados, ser parciales o contradictorios entre fuentes.
**Cómo se aplica:** cada dato se usa con su `source`, `recorded_at`/`retrieved_at` y estado de la
fuente (`sources_degraded`). **La regla de resolución de conflictos está abierta** (HALLAZGOS H-05).
Detalle: `domain/rules/RN-05-calidad-de-datos.md`.

### RN-06 · Datos personales y mínimo privilegio ✅
**Qué dice:** deben protegerse los datos personales y aplicarse mínimo privilegio.
**Cómo se aplica:** qué ve el pasajero está abierto (H-02); lo que sí es fijo: PII fuera de logs,
fuera de prompts a modelos y cada componente con acceso sólo a las tools que necesita.
Detalle: `domain/rules/RN-06-datos-personales.md`.

### RN-07 · Cada entitlement sigue su propia bandera de aprobación 🟡
**Qué dice:** si aplican a la vez una regla sin aprobación y otra con `requires_human_approval: true`,
cada una se trata por separado: la primera se otorga y su opción se ofrece; la segunda se deriva en paralelo.
**Decisión:** H-17, del usuario (2026-10-29). H-17b (lectura conservadora para el piloto) sigue abierta.
Detalle: `domain/rules/RN-07-aprobacion-por-entitlement.md`.

### Reglas dadas (RB) y de diseño (RD) del set de producto
`product/11-reglas-de-negocio-y-restricciones.md` cataloga `RB-01…13` (cada una con su RN) y
`RD-01…15`. Una RD **no es una RN**: es el supuesto con el que la POC cubre una pregunta abierta
`H-XX`, y su ADR (ADR-003 a ADR-008, Propuestos) registra las opciones. Sólo dos están decididas:
RD-11 → RN-03 y RD-13 → RN-07. Las demás pasan acá cuando el usuario responde su `H-XX`.

---

## 2. Edge cases presentes en los datos del enunciado

Observados en `contracts/fixtures/`. El comportamiento esperado de los marcados ❓ lo decide el usuario.

| # | Situación | Por qué importa | Estado |
|---|---|---|---|
| E1 | S1 con DELAY de 160 min (nueva salida 17:10 → llegada estimada 20:35) y S2 sale 19:05 | Conexión perdida probable → `POL-DELAY-2026-03/R3` aunque `R1` (≥180) no aplique | ❓ H-07 (cómo se determina `missed_connection`) |
| E2 | `LEGACY_MIRROR` dice `ON_TIME` (09:30) y `OPS_CORE` dice DELAY (10:48); LEGACY_MIRROR está degradada | Fuentes contradictorias | ❓ H-05 |
| E3 | Grupo con menor (P2, CHILD, 7 años) | `R5` → `PRIORITY_HANDLING` con `requires_human_approval: true` | ✅ dada; 🟡 se deriva en paralelo sin bloquear R3 (RN-07); el resto del *cómo* ❓ H-04 |
| E4 | `O2` tiene 1 asiento y el booking 2 pasajeros | Opción no viable para el grupo completo | ❓ H-08 |
| E5 | `O2` con `fare_difference` 180000 CLP pese a entitlement `REBOOK_NO_FEE` | Contradicción opción vs política | ❓ H-08 |
| E6 | `O3` REFUND con tarifa `refundable: false` y `confidence: LOW` | Opción que contradice la tarifa | ❓ H-08 |
| E7 | `trip_context` con `completeness: PARTIAL` (falta `change_penalty_amount`) | Decidir con datos incompletos | ❓ H-09 |
| E8 | Opciones con `ttl_seconds: 120`; rebooking con `expires_at` | Ofrecer opciones vencidas | ✅ dada (hay TTL); manejo ❓ H-10 |
| E9 | `create_rebooking_request` → 503 `UPSTREAM_TIMEOUT` | Resultado real indeterminado | ✅ RN-03; 🟡 reconciliación decidida (H-12) |

---

## 3. Restricciones y límites
- V1 operable por un equipo pequeño.
- Considerar latencia, costo por interacción y dependencia de modelos.
- No existe una única solución correcta: toda decisión se justifica con alternativas descartadas.

## 4. Preguntas frecuentes del dominio
**Q: ¿Qué es una "modificación relevante"?** — Abierta (H-01). No asumir.
**Q: ¿Cuándo puede ir una recomendación automática?** — Abierta (H-03). Mientras tanto, el diseño
por defecto es conservador: lo que requiere aprobación humana según la política, va a humano.
Lo que sí está decidido: una regla que requiere aprobación no bloquea a otra que no la requiere (RN-07).
