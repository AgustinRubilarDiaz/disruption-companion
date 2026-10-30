# Contexto Global del Sistema: Disruption Companion

## 1. Rol del Agente
Sos un Ingeniero Senior que actúa como "Cerebro Arquitectónico" del proyecto. Antes de proponer
código validás que la solución respete la topología, las fronteras y las reglas de este Brain.

## 2. Qué es este proyecto
Respuesta al **Caso A · Disruption Companion** del desafío técnico Software Engineer Senior
(LATAM · Digital & Data). Enunciado original: `../Docs/Disruption_Companion.pdf`.

**Producto:** ayudar al pasajero cuyo vuelo sufrió una modificación a entender qué ocurrió y cuál es
su siguiente paso, **sin entregar información no verificada** y **sin ejecutar acciones de alto
impacto sin controles**.

**Objetivo de negocio:** reducir incertidumbre del pasajero y contactos evitables al call center,
manteniendo exactitud, seguridad y trazabilidad. La V1 permite que el pasajero:
1. consulte el contexto de su viaje;
2. entienda si hubo una modificación relevante y qué implica;
3. reciba una explicación o recomendación accionable;
4. sea derivado a una persona, o inicie una acción controlada, cuando corresponda.

### Restricciones del desafío (no negociables)
| Restricción | Detalle |
|---|---|
| Tiempo efectivo | **Máximo 3 h** (análisis + implementación + validación + documentación) |
| Track | Elegir uno: **Backend/Integración** o **Frontend/Experience**. La capa complementaria puede quedar como diseño, contrato o pseudocódigo |
| Entregable 1 | Vertical slice + diseño de la capa complementaria: track y por qué, cómo ejecutarlo, alcance, tests, limitaciones |
| Entregable 2 | README de ingeniería, **máx. 2 páginas** |
| Entregable 3 | AI Usage & Decision Note, **máx. 1 página** |
| Defensa | 10 min de presentación + 30–35 min de debate técnico |
| IA en runtime | No obligatoria. Si no se usa, explicar beneficio esperado y por qué no se justifica |

### Qué evalúa el comité
Pensamiento de producto · fundamentos de ingeniería (contratos, estados, errores, límites) ·
desarrollo asistido por IA sin delegar criterio · calidad, seguridad y confiabilidad · priorización
y evidencia · juicio técnico y trade-offs · razonamiento agentic y control (dónde para el agente,
cómo detecta un output incorrecto) · responsabilidad y adaptación.
**No evalúa:** terminar la capa complementaria, usar IA en runtime, estética, velocidad.

## 3. Dominio del negocio
Ver `KNOWLEDGE_BASE.md` (reglas) y `domain/ubiquitous-language.md` (glosario).

## 4. Topología del sistema

### Sistemas externos (dados por el enunciado — contratos en `contracts/tools-api.md`)
| Tool | Tipo | Consideración |
|---|---|---|
| `get_trip_context(booking_id)` | Lectura | Puede devolver información parcial |
| `get_operational_events(segment_ids)` | Lectura | Controlar timestamp, fuente y frescura |
| `get_eligible_options(trip_context)` | Lectura | Opciones candidatas, no una decisión |
| `get_policy_rules(scenario)` | Lectura | Reglas versionadas y verificables |
| `create_rebooking_request(option, idempotency_key)` | **Escritura** | Acción de alto impacto |
| `create_human_case(reason, evidence)` | **Escritura** | Escalamiento a operación humana |
| `notify_passenger(message)` | **Escritura** | No debe enviar información no validada |

### Componentes propios — track **Backend/Integración** (ADR-001), TypeScript + Node (ADR-002)
| Componente | Ruta | Rol | Estado |
|---|---|---|---|
| `disruption-engine` | `engine/` | Combina reserva, eventos y políticas para determinar qué corresponde; orquesta las tools (mockeadas con `contracts/fixtures/`), escala a humano y notifica | Planificado (sin código) |
| `passenger-experience` | `brain/contracts/passenger-experience.md` | Capa complementaria: cómo se comunica al pasajero (mensajes + wireframe) | Diseño, por escribir |

Contrato propio entre ambos: `contracts/disruption-api.md` (se escribe antes del primer código).

## 5. Reglas de Oro
- **Las tools de lectura informan; la lógica propia decide; el humano aprueba lo de alto impacto.**
- `get_eligible_options` propone, no decide (RN-02). La elegibilidad final la determina la lógica
  propia contra la política vigente (RN-01).
- Ninguna escritura de alto impacto sin idempotency key, sin manejo del resultado indeterminado
  y sin el control humano que corresponda (RN-03).
- Nada llega al pasajero sin estar validado y trazado a una `policy_ref` (RN-04).
- Todo dato operacional se evalúa con fuente, timestamp y frescura antes de usarse (RN-05).
- El frontend visualiza; no calcula entitlements ni elegibilidad.
- Cualquier cambio de contrato: Contrato → Productor → Consumidor.

## 6. Protocolo de planificación
Antes de generar código: identificar componentes afectados, verificar si toca una regla RN o un
contrato, presentar el plan de impacto y esperar confirmación.

## 7. ADRs registrados
| ADR | Título | Estado |
|---|---|---|
| ADR-001 | Track Backend/Integración | Aceptado |
| ADR-002 | Stack TypeScript + Node para `disruption-engine` | Aceptado |
| ADR-003…008 | Reservados para los ADR planificados en `Docs/epica/EP-01` §6 | Planificados |
| ADR-009 | Sin IA en runtime: núcleo 100 % determinístico | Aceptado |

## Changelog del Brain
### 2026-10-29 — INIT
- Brain inicializado según el Manual de Implementación (layout monorepo, carpeta `brain/`).
- Dominio, contratos de tools y fixtures cargados desde el enunciado. Ver `enhancements/ENH-001`.
- ADR-001 (track Backend/Integración) y ADR-002 (TypeScript + Node) aceptados.
