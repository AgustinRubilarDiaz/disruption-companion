# HALLAZGOS — lo que todavía NO se sabe

> Complemento del Brain: el Brain guarda lo asentado; esto guarda lo pendiente.
> El agente **no implementa** nada de acá como regla. Al resolverse un hallazgo, se mueve al Brain
> (KNOWLEDGE_BASE 🟡 o ADR) y se marca **Resuelto → destino**.
> Decide: el usuario (DS). Las "propuestas" son opciones para discutir, no decisiones.

## Decisiones pendientes

| ID | Decisión | Por qué bloquea | Estado |
|---|---|---|---|
| D-01 | **Track**: Backend/Integración vs Frontend/Experience | Define topología, componentes y stack | **Resuelto → ADR-001** (Backend) |
| D-02 | Stack del vertical slice | `init-component` y comandos de test | **Resuelto → ADR-002** (TypeScript + Node) |
| D-04 | ¿Servicio HTTP o función invocable? | Forma de `contracts/disruption-api.md` | **Resuelto → servicio HTTP** (la entrega exige `api_url`; `Docs/17` decisión 2) |
| D-03 | ¿IA en runtime? Si no, qué beneficio se esperaba y por qué no se justifica | Exigido por el enunciado §5 | **Resuelto → ADR-009** (sin IA en runtime) |
| D-05 | ¿El bootstrap del harness cuenta dentro de las 3 h? | Cambia el tiempo disponible (`Docs/13` §13.3: ≈ 105 min si cuenta) | Abierta |

## Ambigüedades del enunciado (§4 — deben resolverse o documentarse)

| ID | Pregunta | Propuestas a discutir | Estado |
|---|---|---|---|
| H-01 | ¿Qué es una **modificación relevante**? | (a) todo evento que active una regla de política; (b) + umbral de minutos; (c) GATE_CHANGE informativo, no "relevante" | Abierta |
| H-02 | ¿Qué información puede **mostrarse al pasajero** y cuál no? | Mostrar: estado, horarios, entitlement, opciones. No: fuentes internas, `confidence`, PII de otros pasajeros | Abierta |
| H-03 | ¿Cuándo una recomendación puede ir **automática**? | Sólo si: datos frescos y sin conflicto, regla sin `requires_human_approval`, opción viable para todo el grupo | Abierta |
| H-04 | ¿Cuándo interviene **una persona** antes de actuar o comunicar? | R4/R5, conflicto de fuentes, 503 indeterminado, datos parciales críticos, ninguna opción viable | Abierta |
| H-05 | ¿Qué hacer con **fuentes contradictorias**? ¿Umbral de frescura? | (a) prioridad por fuente; (b) más reciente gana; (c) excluir degradadas; (d) conflicto → humano | Abierta |

## Detectados en los datos de ejemplo

| ID | Hallazgo | Evidencia | Estado |
|---|---|---|---|
| H-06 | `delay_minutes` ¿se mide por segmento o a destino final? | S1 160 min; con O1 la llegada a MEX pasa al día siguiente | Abierta |
| H-07 | ¿Cómo se determina `missed_connection` e `international`? Falta tiempo mínimo de conexión y **zona horaria** de los horarios | S1 nueva llegada ~20:35 vs S2 sale 19:05 | Abierta |
| H-08 | Criterios para filtrar opciones candidatas | O2: 1 asiento para 2 pax y diferencia de 180000 CLP pese a `REBOOK_NO_FEE`; O3: refund con tarifa no reembolsable y `LOW` | Abierta |
| H-09 | ¿Qué hacer con `completeness: PARTIAL`? | Falta `change_penalty_amount` | Abierta |
| H-10 | Vigencia: opciones con TTL 120 s y rebooking con `expires_at`. ¿Quién confirma `PENDING_CONFIRMATION`? | `_meta.ttl_seconds`, `expires_at` | Abierta |
| H-11 | ¿Qué pasa si una tool de lectura falla o la política no está disponible? | Errores de lectura no especificados | Abierta |
| H-12 | Derivación de la idempotency key y reconciliación tras 503 | `UPSTREAM_TIMEOUT` = indeterminado | Abierta |
| H-13 | `condition` de la política es un string: ¿se interpreta o se mapea a código? | `"delay_minutes >= 240 AND international"` | Abierta |
| H-14 | ¿`compensation_requested` de dónde sale? ¿Lo pide el pasajero en la conversación? | `POL-DELAY-2026-03/R4` | Abierta |
| H-15 | O1 implica pernocta en LIM (sale 16-09 08:15) y la política DELAY no tiene regla de hotel. ¿Se informa, se deriva o queda fuera de alcance? | `get_eligible_options` O1 vs `POL-DELAY-2026-03` | Abierta |
| H-16 | No hay baseline de contactos al call center ni de reclamos: las metas de OV-1 (−20 %) y OV-2 (≤ 1 %) son hipótesis | `brain/product/05-objetivos-medibles.md` | Abierta |
| H-17 | Con R5 (menor, requiere humano) y R3 (sin aprobación) a la vez: ¿se recomienda O1 en automático y se escala R5 en paralelo, o todo el caso va a humano? | Caso base, `brain/product/07-flujo.md` §7.2 | **Resuelto (P-17)** → cada entitlement sigue su propia bandera; implementado en `engine/` |
| H-18 | Urgencia y objetivo estratégico asignado (costo de atención, reclamos, experiencia) | `Docs/01` §1.2 y §1.4 | Abierta |
| H-19 | Volúmenes y costos: disrupciones/mes, tasa de contacto, costo por contacto, tiempo de atención L2, costo de reclamo | Sin esto no hay meta de OV-2 ni beneficio (`Docs/10` §10.5) | Abierta |
| H-20 | AS-IS real: ¿hay autoservicio o aviso de disrupciones? ¿se registra por qué se ofreció algo? | `Docs/10` §10.1 | Abierta |
| H-21 | ¿La política interna incorpora la regulación de derechos del pasajero de cada país de la ruta? | `Docs/11` RS-06 | Abierta |
| H-22 | No hay suscripción a eventos: ¿cómo se dispara un aviso proactivo? | `Docs/11` RS-13 | Abierta |
| H-23 | O3 cita `POL-REFUND-2026-01`, que no se entrega | `get_eligible_options` O3 | Abierta |
| H-24 | Autenticación, latencia, límites de uso y SLA de cada tool | `Docs/12` §12.7 | Abierta |
| H-25 | ¿`loyalty_tier` / `fare_family` influyen en prioridad u opciones? Ninguna regla los usa | `Docs/11` §11.4 | Abierta |
| H-26 | ¿Fecha tope crítica (temporada alta, contrato, regulación)? | `Docs/13` §13.2 | Abierta |
| H-27 | ¿Quiénes validan avances y con qué disponibilidad? | `Docs/13` §13.2 | Abierta |
| H-28 | ¿Presupuesto asignado (equipo, infra, costo por interacción)? | `Docs/13` §13.2 | Abierta |
| H-29 | Si `get_policy_rules` falla no hay `policy_ref` para un mensaje validado: hoy responde 500. ¿Existe un mensaje genérico de contacto aprobado sin política? | `engine/src/app/orchestrator.ts`; Docs/16 §16.1 pide 200 + `READ_FAILURE` | Abierta |
| H-30 | Cada GET de evaluación llama a `notify_passenger` (mock). ¿Se notifica por evaluación o sólo cuando cambia la decisión? | `engine/src/app/orchestrator.ts` | **Mitigado en el mock:** `create_human_case` y `notify_passenger` se deduplican por `decision_id` (`MockState`). Abierta para producción: ¿las tools reales deduplican por `decision_id`, o hay que hacerlo en el motor? |
| H-31 | El mock deduplica por `decision_id`, pero en el escenario de demostración el `decision_id` es fijo. En producción cada evaluación tendría uno nuevo, y refrescar la pantalla crearía otro caso | `engine/src/adapters/mock/mockTools.ts` | Abierta (definir si `decision_id` es estable por reserva y estado de los datos) |
| H-32 | La pantalla usa un canal de contacto genérico ("Contacta a un agente de LATAM"): el enunciado no define ninguno | `brain/contracts/passenger-experience.md` | Abierta (pregunta al Domain Specialist) |
| H-33 | La vigencia de la opción corre en la pantalla desde que carga, porque el reloj de la demo es fijo. Con reloj real habría que medirla contra `valid_until` | `web/src/App.tsx` (`useCountdown`) | Abierta (cambia al conectar sistemas reales) |

## Harness / entorno

| ID | Hallazgo | Acción | Estado |
|---|---|---|---|
| H-90 | En `~/CLAUDE.md` y `~/.claude/skills/` hay un harness de **otro proyecto (MOT)** con skills del mismo nombre que se cargan en toda sesión | El router de la raíz lo declara no aplicable y los skills de acá se leen por ruta explícita. Si molesta, abrir el proyecto con esos skills deshabilitados | Mitigado |
| H-91 | Los diagramas de `brain/architecture/diagrams.md` no se validaron con parser | Correr `npx -y @mermaid-js/mermaid-cli` cuando haya red | Abierta |
| H-92 | El repo no tiene remote | Definir dónde se entrega (GitHub, zip) antes del primer push | Abierta |
