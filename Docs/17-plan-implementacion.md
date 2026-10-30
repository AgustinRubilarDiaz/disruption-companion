# 17. Plan de implementación del vertical slice

- **Estado:** Propuesto. No se escribe código hasta aprobar este plan **y** los escenarios BDD (§6.3).
- **Track y stack:** Backend/Integración (ADR-001) · TypeScript + Node (ADR-002) · sin IA en runtime (ADR-009).
- **Alcance:** HU-001 a HU-005 y HU-008 implementadas. HU-006 y HU-007 quedan como contrato y
  pseudocódigo, y HU-010 como especificación (corte del documento 13, §13.3).
- **Contrato que implementa:** `DisruptionAssessment` v1.0 (documento 16).

---

## 1. Decisiones de entrada (a aprobar)

| # | Decisión | Propuesta | Por qué |
|---|---|---|---|
| 1 | **P-17: R3 y R5 a la vez** | **Cada entitlement sigue su propia bandera `requires_human_approval`.** R3 se otorga (`GRANTED`) y O1 se recomienda; R5 queda `PENDING_APPROVAL` y genera un caso en paralelo | Es la lectura literal de la política, sin agregar reglas. El contrato y los fixtures ya funcionan así, así que no hay que cambiar nada. Si el negocio quiere que un menor bloquee todo, lo expresa en la política (por ejemplo, `requires_human_approval: true` en R3 para grupos con menores) y el motor lo respeta sin cambiar código |
| 2 | **Interfaz: servicio HTTP o función** (D-04) | **Servicio HTTP** | El envío final exige una `api_url` pública que los revisores van a consultar |
| 3 | **Umbral de frescura** `max_event_age_minutes` | **30 min**, configurable por variable de entorno | En el caso base, el retraso tiene 14 min al momento de la evaluación y es válido. El evento de `LEGACY_MIRROR` tiene 92 min: queda descartado por dos motivos (degradado y viejo) |
| 4 | **Reloj de los mocks** | **Reloj fijo por escenario**: en modo demo, `now` = hora del escenario (`2026-09-15T11:02:40Z` en el caso base). La respuesta lo declara en el encabezado `X-Simulated-Clock` | Con el reloj real, las opciones del enunciado (vigencia de 120 s del 15-09) estarían siempre vencidas |
| 5 | **Cómo se ejecutan los escenarios BDD** | Los `.feature` se escriben en Gherkin y se ejecutan como **tests de vitest con el mismo nombre de escenario**; cucumber-js queda como mejora | ADR-002 prevé cucumber-js, pero su configuración con TypeScript consume tiempo que no hay. Este cambio hay que registrarlo como enmienda de ADR-002 |
| 6 | **Dónde se despliega** | **Render** (servicio web Node desde GitHub, sin CLI) o la plataforma en la que tengas cuenta | Es lo más rápido para obtener una URL pública. Requiere una cuenta tuya |
| 7 | **MCT** (tiempo mínimo de conexión) | 0 min, configurable | Supuesto P-07; en el caso base, la conexión se pierde igual |

---

## 2. Estructura del componente

```
engine/
├─ package.json            # versiones fijadas en el build
├─ tsconfig.json
├─ vitest.config.ts
├─ Dockerfile              # opcional, si la plataforma lo necesita
├─ src/
│  ├─ domain/              # funciones puras: no hacen I/O ni leen el reloj
│  │  ├─ types.ts          # modelo de datos (§3)
│  │  ├─ consolidate.ts    # HU-001: fuentes, frescura, conflicto
│  │  ├─ impact.ts         # HU-002: conexión perdida, trip_status
│  │  ├─ policy.ts         # HU-003: predicados por rule_id
│  │  ├─ options.ts        # HU-004: filtro y orden
│  │  ├─ control.ts        # HU-005: next_step y derivaciones
│  │  ├─ message.ts        # HU-006: plantilla con policy_ref
│  │  └─ assess.ts         # arma DisruptionAssessment + DecisionRecord
│  ├─ ports/tools.ts       # interfaces de las 7 tools (contratos del enunciado)
│  ├─ adapters/mock/       # tools simuladas con los fixtures + escenarios demo
│  ├─ app/orchestrator.ts  # llamadas en paralelo, manejo de errores y escrituras
│  └─ http/server.ts       # GET /v1/bookings/:id/disruption-assessment, GET /health
├─ fixtures/               # copia de los fixtures del enunciado y del contrato
└─ test/
   ├─ unit/                # una suite por módulo de domain/
   ├─ contract/            # salida = fixture del documento 16 + invariantes
   ├─ scenarios/           # un test por escenario de los .feature
   └─ http/                # API levantada en memoria
```

**Regla de diseño:** `domain/` no conoce HTTP, ni las tools, ni el reloj real. Recibe datos y
devuelve datos. Eso hace que toda la lógica de decisión sea testeable con los fixtures.

---

## 3. Modelo de datos

### 3.1 Entrada: contratos de las tools (se copian del enunciado sin cambios)
| Tipo | Campos principales |
|---|---|
| `TripContext` | `booking_id`, `passengers[]` (`type`, `age`; los datos personales se leen pero no se propagan), `segments[]`, `fare_conditions`, `_meta` (`retrieved_at`, `completeness`, `missing_fields`) |
| `OperationalEvents` | `events[]` (`event_id`, `segment_id`, `type`, `source`, `recorded_at`, campos por tipo), `_meta` (`sources_available`, `sources_degraded`) |
| `EligibleOptions` | `options[]` (`option_id`, `type`, `policy_ref`, `confidence`, campos de vuelo), `_meta` (`retrieved_at`, `ttl_seconds`) |
| `PolicyRules` | `scenario`, `version`, `effective_from`, `rules[]` (`rule_id`, `condition`, `entitlement`, `requires_human_approval`), `_meta.superseded_versions` |
| Respuestas de escritura | `RebookingResult` (201, 409, 503), `HumanCaseResult` (201), `NotificationResult` (202, 422) |

### 3.2 Modelo interno (dominio)
| Tipo | Qué representa |
|---|---|
| `SafeGroup` | `{ passenger_count, includes_minor }`. Es lo único que sale del adaptador de reserva hacia el dominio |
| `EventDecision` | Evento + `used` o `discarded` + motivo (`SOURCE_DEGRADED`, `STALE`, `SUPERSEDED_BY_NEWER`) |
| `ConsolidatedSegment` | Estado por segmento (`SCHEDULED`, `ON_TIME`, `DELAYED`, `UNVERIFIED`), `delay_minutes`, nueva salida, llegada estimada, puerta, `data_as_of` y conflicto (sí o no) |
| `Facts` | `delay_minutes` (máximo por segmento), `international`, `missed_connection`, `compensation_requested`, `group_includes_minor` |
| `RuleEvaluation` | `rule_id`, `applies`, `facts` usados, `supported` (si existe un predicado para esa regla) |
| `OptionEvaluation` | `option_id`, `result` (`RECOMMENDED`, `VIABLE`, `DISCARDED`), `reasons[]` (catálogo del documento 16, §16.7) |
| `Escalation` | `reason` (catálogo de la épica, §4.3), `rule_id` opcional, `status`, `case_id`, `sla_minutes` |
| `EvaluationConfig` | `max_event_age_minutes`, `mct_minutes`, `now` (reloj inyectado) |

### 3.3 Salida
- **`DisruptionAssessment`** (documento 16): es lo que se expone por HTTP.
- **`DecisionRecord`** (documento 16, §16.6): queda en el registro, no se expone. Su `booking_ref`
  es un HMAC del `booking_id` con una sal de entorno.

### 3.4 Algoritmos (en el orden del flujo)
| Paso | Función | Regla |
|---|---|---|
| 1 | `consolidate(events, meta, now, cfg)` | Por segmento y tipo de evento: (a) se descartan las fuentes degradadas si hay una sana; (b) se descarta lo más viejo que `max_event_age_minutes`; (c) entre fuentes sanas gana la más reciente; (d) si dos fuentes sanas y frescas dicen estados incompatibles, el segmento queda `UNVERIFIED` con conflicto; (e) un segmento sin eventos válidos queda `UNVERIFIED`. `data_as_of` = el evento usado más antiguo |
| 2 | `computeImpact(segments, cfg)` | Llegada estimada = llegada programada + `delay_minutes`. `missed_connection` = llegada estimada + MCT > salida del segmento siguiente. `trip_status`: `UNVERIFIED` si algún segmento lo está; `RELEVANT_CHANGE` si aplica una regla o se pierde la conexión; `INFORMATIVE_CHANGE` si sólo hay cambio de puerta; `NO_CHANGE` en otro caso |
| 3 | `evaluatePolicy(policy, facts, tripDate)` | Se rechaza la versión si está en `superseded_versions` o si `effective_from` es posterior al viaje. Hay **un predicado en código por `rule_id`** (R1 a R5). Una regla sin predicado queda `supported: false` y genera `UNSUPPORTED_RULE` |
| 4 | `filterOptions(options, entitlements, group, fare, policy, now)` | Se descarta según el catálogo §16.7. Si las opciones están vencidas, se vuelven a pedir una vez (en el orquestador). Orden: menor costo, llegada más temprana, `confidence` |
| 5 | `decideControl(...)` | `UNVERIFIED` → `WAIT_FOR_AGENT` + `READ_FAILURE` o `SOURCE_CONFLICT`. Sin opción viable → `NO_VIABLE_OPTION`. Hay opción → `ACCEPT_OPTION`. Además, una derivación `APPROVAL_REQUIRED` por cada entitlement `PENDING_APPROVAL` (decisión 1) |
| 6 | `buildMessage(assessment)` | Plantilla por (`trip_status`, `next_step`). Los parámetros sólo se toman de la evaluación y `policy_ref` es obligatorio: si falta, falla la construcción (garantía del 422) |
| 7 | `assess(...)` | Arma el `DisruptionAssessment` y el `DecisionRecord`, y verifica las invariantes antes de responder |

**`international`:** se considera internacional cuando el país de origen y el de destino son
distintos, según una tabla mínima de aeropuertos (SCL → CL, LIM → PE, MEX → MX). Es un supuesto
(P-07); si un aeropuerto no está en la tabla, el valor es desconocido y R2 no se aplica en automático.

---

## 4. Orquestador y manejo de errores

```
assessDisruption(bookingId):
  trip ← get_trip_context(bookingId)              # falla → UNVERIFIED + READ_FAILURE
  en paralelo:
    events  ← get_operational_events(segments)    # falla → UNVERIFIED + READ_FAILURE
    policy  ← get_policy_rules("DELAY")           # falla → sin entitlements + READ_FAILURE
    options ← get_eligible_options(trip)          # vencidas → reintento único
  resultado ← domain.assess(...)
  por cada derivación: create_human_case(reason, evidence sin datos personales)
                       # falla → status CREATION_FAILED + canal alternativo en el mensaje
  registrar DecisionRecord (log estructurado, sin datos personales)
  devolver DisruptionAssessment
```

- `notify_passenger` y `create_rebooking_request` **no se llaman** en el slice.
- Se entregan como pseudocódigo en el README, con la tabla de respuestas del documento 7: 202 y 422
  para la notificación; 201, 409 y 503 para el cambio de vuelo con la misma key.
- **Si sobra tiempo**, se implementa `requestRebooking` con un mock que devuelve 503 y después 409,
  porque la pregunta 4 del comité pide evidencia en el slice.

---

## 5. API HTTP

| Ruta | Respuesta |
|---|---|
| `GET /health` | `200 { "status": "ok" }` |
| `GET /v1/bookings/{booking_id}/disruption-assessment` | 200 con `DisruptionAssessment`, o 400, 404 o 500 según el documento 16, §16.1 |
| `GET /v1/scenarios` | Lista de las reservas de demostración y qué muestra cada una |

### Reservas de demostración
Datos sintéticos derivados del enunciado, sin datos personales reales. Son los casos que los
revisores pueden consultar en la URL pública.

| `booking_id` | Variante | Resultado esperado |
|---|---|---|
| `ABC123` | Caso base del enunciado | `RELEVANT_CHANGE`, R3 y R5, O1 recomendada, caso por R5 (igual al fixture del documento 16) |
| `DEMOCONF` | Dos fuentes sanas se contradicen en S1 | `UNVERIFIED`, `WAIT_FOR_AGENT`, `SOURCE_CONFLICT` |
| `DEMONOEV` | No hay eventos para los segmentos | `UNVERIFIED`, nunca `NO_CHANGE` |
| `DEMOEXP` | Las opciones vencieron y la nueva consulta también vuelve vencida | Ninguna opción, `READ_FAILURE` |
| `DEMOSUP` | La política vigente figura como reemplazada | Sin entitlements, `READ_FAILURE` |
| `DEMOUNK` | La política trae una regla R6 desconocida | R3 y R5 se evalúan igual + `UNSUPPORTED_RULE` |
| `DEMONOOPT` | Ninguna opción sirve para el grupo | `WAIT_FOR_AGENT`, `NO_VIABLE_OPTION` |

Cualquier otro identificador devuelve un 404 neutro.

---

## 6. Estrategia de pruebas

### 6.1 Tests unitarios (`test/unit`, vitest)
| Módulo | Casos mínimos |
|---|---|
| `consolidate` | Descarta la fuente degradada (E-1012); evento viejo descartado; conflicto entre dos fuentes sanas → `UNVERIFIED`; sin eventos → `UNVERIFIED`; `data_as_of` = evento más antiguo usado |
| `impact` | 20:35 contra 19:05 → conexión perdida; MCT configurable; sólo cambio de puerta → `INFORMATIVE_CHANGE`; todo programado → `NO_CHANGE` |
| `policy` | Caso base: aplican R3 y R5, no aplican R1, R2 ni R4; 250 min en un vuelo internacional → R1 y R2; compensación pedida → R4 `PENDING_APPROVAL`; versión reemplazada → rechazo; regla desconocida → `UNSUPPORTED_RULE` |
| `options` | O1 recomendada; O2 con 2 motivos; O3 con 3 motivos; opción vencida → `EXPIRED`; orden entre viables |
| `control` | `ACCEPT_OPTION` + `APPROVAL_REQUIRED` en paralelo (decisión 1); `UNVERIFIED` → `WAIT_FOR_AGENT` |
| `message` | Sin `policy_ref`, falla; los parámetros sólo salen de la evaluación |

### 6.2 Tests de contrato (`test/contract`)
- `assess("ABC123")` es **igual** a `disruption_assessment_ABC123.json`, salvo `decision_id`, que se inyecta.
- Las invariantes 1, 2, 3, 4, 6, 7 y 8 del documento 16 se verifican sobre **todas** las reservas de demostración.
- **Búsqueda de datos personales:** ni la respuesta ni el `DecisionRecord` contienen el nombre, el
  email, el teléfono, el documento ni la categoría de pasajero frecuente.

### 6.3 Escenarios BDD (`brain/features/*.feature` → `test/scenarios`)
Un `.feature` en español con el caso base y los 6 casos negativos de §5. **Se aprueba antes de
escribir código.** Cada escenario tiene un test con el mismo nombre.

### 6.4 Tests de la API (`test/http`)
La API se levanta en memoria y se verifica:
- `/health` responde 200.
- `ABC123` responde 200 y es igual al fixture.
- Un `booking_id` inválido responde 400.
- Una reserva desconocida responde 404 con un cuerpo neutro.
- Las respuestas incluyen el encabezado `X-Simulated-Clock`.

### 6.5 Pruebas locales y prueba sobre el despliegue
```
npm ci && npm test                 # unitarios + contrato + escenarios + API
npm run dev                        # API local en :3000
curl localhost:3000/v1/bookings/ABC123/disruption-assessment
npm run smoke -- https://<api_url> # mismas verificaciones contra la URL pública
```

### 6.6 Trazabilidad entre tests y criterios de aceptación
| HU | Criterios cubiertos con test |
|---|---|
| HU-001 | 1, 2, 3, 4, 6, 7, 8, 9, 10 |
| HU-002 | 1 a 6 |
| HU-003 | 1 a 8 |
| HU-004 | 1 a 9 |
| HU-005 | 1, 2, 3, 4, 6 (el 5, sin duplicados por `decision_id`, queda como limitación) |
| HU-008 | 1, 2, 4, 5 |

---

## 7. Entregables y envío

| Entregable | Contenido | Dónde |
|---|---|---|
| 1 · Evidencia técnica | Código, tests, instrucciones, alcance, limitaciones, capa complementaria (documento 16 + especificación del mensaje + pseudocódigo de HU-006 y HU-007) | `engine/` + `README.md` |
| 2 · README de ingeniería (2 páginas como máximo) | Problema y resultado esperado, supuestos y alcance, decisiones y alternativas, tabla de pasos (determinístico o humano), riesgos, validación | `README.md` en la raíz (síntesis de los documentos 01 a 17) |
| 3 · AI Usage & Decision Note (1 página como máximo) | Herramientas, outputs aceptados, modificados o rechazados, decisiones personales, qué nunca se entrega a un modelo | `AI_USAGE.md` (sale del registro de uso de IA) |
| Repositorio público | Repositorio en GitHub con todo lo anterior | `github_url` |
| API pública | Servicio desplegado con las reservas de demostración | `api_url` |
| Envío | `POST` único con `name`, `mail`, `github_url` y `api_url` | **Lo hacés vos, una sola vez**, y verificás que la respuesta sea `{"status":"OK","detail":"your request was received"}` |

**Antes de publicar el repositorio:** verificar que no haya secretos ni datos personales reales.
También hay que decidir si el Brain (`brain/`) y los informes de `Docs/Evaluadores/` se publican tal
cual o se excluyen.

---

## 8. Orden y estimación

| # | Paso | Minutos | Gate |
|---|---|---|---|
| 0 | Aprobar este plan y las decisiones de §1 | 5 | **Gate** |
| 1 | Escribir el `.feature` (caso base + 6 negativos) y aprobarlo | 10 | **Gate** |
| 2 | Andamiaje de `engine/`, tipos, puertos, mocks y fixtures | 15 | — |
| 3 | `consolidate`, `impact` y `policy` con sus tests | 25 | — |
| 4 | `options`, `control`, `message` y `assess` con sus tests y el test de contrato | 25 | — |
| 5 | Orquestador, API HTTP, reservas de demostración y tests de la API | 15 | — |
| 6 | Repositorio en GitHub y despliegue con prueba sobre la URL pública | 15 | Necesita tus cuentas |
| 7 | `README.md` y `AI_USAGE.md` | 25 | Revisión tuya |
| 8 | Cierre de versionado y envío (`POST`, lo hacés vos) | 5 | **Gate** |
| | **Total** | **≈ 140** | |

**Si no alcanza el tiempo, se recorta en este orden:**
1. Las reservas de demostración se reducen a `ABC123`, `DEMOCONF` y `DEMONOEV`.
2. La prueba sobre el despliegue se reduce a `curl` manual.
3. Los tests unitarios de `message` y del orden de opciones se declaran como limitación.

**Lo que no se recorta:** el caso base igual al fixture, la búsqueda de datos personales, el
despliegue y los dos documentos de entrega. Sin ellos el envío no es válido.

## 9. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| El tiempo no alcanza | Corte del §8; los documentos ya existen, así que el README es una síntesis |
| La plataforma de despliegue falla o pide una tarjeta | Tener una alternativa elegida (Render, Railway, Fly.io) antes del paso 6 |
| Opciones siempre vencidas con el reloj real | Reloj fijo por escenario, declarado en `X-Simulated-Clock` (decisión 4) |
| Publicar datos sensibles en el repositorio | Revisión previa (§7); los fixtures sólo tienen los datos de ejemplo del enunciado |
| Enviar el `POST` con datos incorrectos | Lo envía el candidato una sola vez, después de verificar `api_url` con la prueba sobre el despliegue |
