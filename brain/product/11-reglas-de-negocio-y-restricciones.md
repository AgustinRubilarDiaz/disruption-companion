# 11. Reglas de negocio y restricciones

Consolidado de todas las reglas y restricciones, clasificadas por su origen. Esa clasificación
importa: **una regla dada no se discute; una regla de diseño es una propuesta que puede cambiar.**

| Tipo | Prefijo | Origen | ¿Se puede cambiar? |
|---|---|---|---|
| Regla de negocio dada | `RB-XX` | Explícita en el enunciado | No |
| Regla de política | `POL-…/RX` | Política versionada que entrega `get_policy_rules` | Sólo el dueño de la política, con una versión nueva |
| Regla de diseño | `RD-XX` | Decisión propia para cubrir una ambigüedad | Sí, al responder la pregunta `H-XX` |
| Restricción | `RS-XX` | Límite del negocio, técnico o del desafío | No en la V1 |

**Relación con las reglas `RN-XX` de la base de conocimiento.** Las `RN` agrupan lo que ya no se
discute: las reglas dadas (✅) y las ambigüedades que el usuario decidió (🟡). Cada `RB` tiene su
`RN`. Una `RD` sólo pasa a `RN` cuando se responde su pregunta `H-XX`; mientras tanto es un supuesto
de la POC, y su ADR registra las opciones consideradas.

---

## 11.1 Reglas de negocio dadas por el enunciado

| ID | Regla | Consecuencia en el producto | RN |
|---|---|---|---|
| RB-01 | Lo que le corresponde al pasajero lo define la **política vigente**, que está versionada | Toda recomendación cita la versión y la regla (`policy_ref`, `rule_id`); las versiones reemplazadas no se usan | RN-01 |
| RB-02 | `get_eligible_options` entrega **opciones candidatas, no una decisión final** | Cada opción se valida contra la política, el grupo y su vigencia antes de ofrecerla | RN-02 |
| RB-03 | Cambiar una reserva o emitir una compensación son **acciones de alto impacto** | Nunca sin control: confirmación, idempotencia y aprobación humana cuando corresponde | RN-03 |
| RB-04 | `create_rebooking_request` exige una **idempotency key** | Toda solicitud se puede reintentar sin duplicar | RN-03 |
| RB-05 | Un 409 `DUPLICATE_REQUEST` significa que la solicitud **ya existe** | Se trata como éxito y se usa el `request_id` devuelto | RN-03 |
| RB-06 | Un 503 `UPSTREAM_TIMEOUT` deja el resultado **indeterminado** | No se asume ni éxito ni fracaso; se reconcilia o se deriva | RN-03 |
| RB-07 | Una solicitud de cambio creada queda `PENDING_CONFIRMATION`, con `expires_at` | Al pasajero se le dice "solicitado", nunca "confirmado" | RN-03 |
| RB-08 | `notify_passenger` **no debe enviar información no validada**; rechaza con 422 si falta `policy_ref` | Los mensajes se arman desde hechos verificados y llevan `policy_ref` | RN-04 |
| RB-09 | Los datos operacionales pueden estar **desactualizados o ser contradictorios**; hay que controlar hora, fuente y frescura | Todo dato viaja con su fuente y su hora; se evalúa antes de usarlo | RN-05 |
| RB-10 | `get_trip_context` puede devolver **información parcial** | Se informa `completeness` y se decide si el faltante es crítico | RN-05 |
| RB-11 | Las opciones tienen **vigencia** (`ttl_seconds`) | No se ofrece una opción vencida | RN-02 |
| RB-12 | Existe un **escalamiento a operación humana** (`create_human_case`) con cola y SLA | Derivar es un siguiente paso válido y se comunica con su SLA | RN-03 |
| RB-13 | Hay que **proteger los datos personales y aplicar mínimo privilegio** | Cada componente accede sólo a lo que necesita; sin datos personales en logs ni prompts | RN-06 |

## 11.2 Reglas de la política `POL-DELAY-2026-03`
Vigente desde el 2026-03-01; reemplaza a `POL-DELAY-2025-11`.

| Regla | Condición | Entitlement | ¿Requiere aprobación humana? | En el caso base |
|---|---|---|---|---|
| R1 | `delay_minutes >= 180` | `REBOOK_NO_FEE` | No | No aplica (160 min) |
| R2 | `delay_minutes >= 240 AND international` | `MEAL_VOUCHER` | No | No aplica |
| R3 | `missed_connection == true` | `REBOOK_NO_FEE` | No | **Aplica** |
| R4 | `compensation_requested == true` | `CASH_COMPENSATION` | **Sí** | Sólo si el pasajero la pide (H-14) |
| R5 | `group_includes_minor == true` | `PRIORITY_HANDLING` | **Sí** | **Aplica** (Tomás, 7 años) |

**Observaciones:**
- Dos reglas (R1 y R3) otorgan el mismo entitlement. No se suman: el pasajero tiene un cambio sin costo, no dos.
- Ninguna regla habilita un **reembolso**. La opción O3 cita `POL-REFUND-2026-01`, una política que el
  enunciado no entrega (H-23). Sin esa política, el reembolso no se puede validar y no se ofrece.
- Ninguna regla usa `loyalty_tier` ni `fare_family`: no se usan para decidir (H-25).
- Ninguna regla cubre alojamiento por pernocta (H-15).

## 11.3 Reglas de diseño propuestas

| ID | Regla | Cubre | Pregunta | Estado |
|---|---|---|---|---|
| RD-01 | Una modificación es **relevante** si activa una regla de la política o hace perder una conexión; `GATE_CHANGE` es informativo | Qué es relevante | H-01 | Supuesto de la POC |
| RD-02 | El pasajero ve el estado, los horarios, lo que le corresponde, las opciones viables y la hora del dato; **no** ve `confidence`, fuentes internas, IDs de regla ni datos de otros pasajeros | Qué se muestra | H-02 | Supuesto · ADR-007 |
| RD-03 | Una respuesta es **automática** sólo si los datos son frescos y no hay conflicto, la regla no exige aprobación y la opción sirve para todo el grupo | Cuándo es automática | H-03 | Supuesto · ADR-005 |
| RD-04 | **Interviene una persona** ante R4 o R5, un conflicto entre fuentes sanas, un dato crítico faltante, ninguna opción viable, una regla desconocida, una falla de lectura o un 503 sin reconciliar | Cuándo interviene una persona | H-04 | Supuesto · ADR-005 |
| RD-05 | Ante fuentes contradictorias: se descarta la degradada si hay una sana; entre sanas gana la más reciente; si dos sanas se contradicen en algo que cambia la decisión, se deriva | Conflicto de fuentes | H-05 | Supuesto · ADR-003 |
| RD-06 | Un evento más antiguo que `max_event_age_minutes` se informa con su hora y no habilita acciones | Frescura | H-05 | Supuesto · ADR-003 (la POC descarta el evento viejo) |
| RD-07 | El retraso se mide **por segmento** | Cómo se mide el retraso | H-06 | Supuesto · ADR-003 |
| RD-08 | Hay conexión perdida si `llegada estimada + MCT > salida del segmento siguiente` | Conexión perdida | H-07 | Supuesto · ADR-003 (MCT 0) |
| RD-09 | Se descarta una opción si: no alcanzan los asientos para el grupo, cobra diferencia pese a un cambio sin costo, es un reembolso con tarifa no reembolsable, no cita la política vigente, tiene confianza `LOW` o venció | Filtro de opciones | H-08 | Supuesto · ADR-005 |
| RD-10 | Un dato faltante es **crítico** sólo si cambia la decisión (`change_penalty_amount` no lo es si el cambio es sin costo) | Contexto parcial | H-09 | Supuesto **sin implementar** (H-37) |
| RD-11 | La idempotency key es determinística: `hash(booking_id + option_id + policy_version + passenger_count)`; ante un 503 se reintenta con la misma key, hasta 2 veces, y luego se deriva | Idempotencia | H-12 | 🟡 Decidida → RN-03 · ADR-006 (H-36) |
| RD-12 | La `condition` se evalúa con un intérprete acotado (`hecho op valor` unidos por `AND`, catálogo cerrado de hechos); una condición que no entiende no se aplica y se deriva | Condiciones de la política | H-13 | Supuesto · ADR-004 |
| RD-13 | Si aplican R3 y R5 a la vez, se recomienda la opción en automático y R5 se deriva en paralelo | R3 + R5 | H-17 | 🟡 Decidida → RN-07 |
| RD-14 | Que no lleguen eventos nunca significa "sin cambios": el estado es `UNVERIFIED` | Ausencia de datos | H-11 | Supuesto · ADR-003 |
| RD-15 | La unidad de decisión es la **reserva completa**: una opción vale sólo si sirve para todos sus pasajeros | Grupo | H-08 | Supuesto · ADR-005 |

## 11.4 Lo que NO es una regla (y no se usa como tal)
- **`confidence` de una opción:** es una señal del sistema que propone, no un derecho del pasajero. Sólo se usa para no ofrecer en automático las opciones `LOW` y para desempatar.
- **`loyalty_tier`:** no aparece en ninguna regla. Priorizar por categoría de pasajero sería inventar una regla (H-25).
- **El orden de las opciones** que entrega `get_eligible_options` no es una recomendación.

---

## 11.5 Restricciones

### Del negocio
| ID | Restricción | Efecto en el diseño |
|---|---|---|
| RS-01 | Una recomendación incorrecta genera costo, reclamo o incumplimiento de política | La exactitud está por sobre la cobertura; la meta de error se deriva de la economía (documento 10) |
| RS-02 | Las acciones de alto impacto requieren controles | Confirmación del pasajero, idempotencia y aprobación humana |
| RS-03 | No hay una única solución correcta | Cada decisión se documenta con sus alternativas descartadas (ADR) |

### Regulatorias y de privacidad
| ID | Restricción | Efecto en el diseño |
|---|---|---|
| RS-04 | Protección de datos personales | `email`, `phone` y `document_id` no salen del adaptador de reserva salvo hacia el canal de notificación; nunca a logs ni a modelos |
| RS-05 | Mínimo privilegio | Los componentes de lectura no escriben; sólo el orquestador llama a los sistemas de escritura |
| RS-06 | Posibles derechos del pasajero definidos por regulación (no mencionados en el enunciado) | Se asume que la política interna ya los incorpora; hay que confirmarlo (H-21) |

### Operativas
| ID | Restricción | Efecto en el diseño |
|---|---|---|
| RS-07 | La V1 la debe operar un equipo pequeño | Pocas piezas, lógica determinística testeable y un único registro de decisiones |
| RS-08 | La operación humana tiene un SLA (45 min en `DISRUPTION_L2`) | Derivar tiene un costo de tiempo que se comunica al pasajero |

### Técnicas
| ID | Restricción | Efecto en el diseño |
|---|---|---|
| RS-09 | Latencia | Lecturas en paralelo; meta p95 menor a 3 s |
| RS-10 | Costo por interacción | Núcleo sin llamadas a modelos |
| RS-11 | Dependencia de modelos | Ninguna decisión depende de un modelo; si el modelo falla, el producto sigue funcionando |
| RS-12 | Hay que mantener los contratos de los sistemas, incluso en los mocks | Los mocks reproducen exactamente las respuestas del enunciado |
| RS-13 | No hay un mecanismo de suscripción a eventos | La V1 responde cuando el pasajero consulta; el aviso proactivo necesita un disparador que no existe (H-22) |

### Del desafío
| ID | Restricción | Efecto en el diseño |
|---|---|---|
| RS-14 | Máximo 3 h efectivas, incluidos análisis, implementación, validación y documentación | Vertical slice acotado; el resto queda como diseño (corte en el documento 13, §13.3) |
| RS-15 | Un solo track en profundidad | La capa complementaria queda como contrato, especificación o pseudocódigo |
| RS-16 | README de ingeniería de 2 páginas como máximo y nota de uso de IA de 1 página como máximo | Esta documentación es la base; los entregables son su síntesis |
