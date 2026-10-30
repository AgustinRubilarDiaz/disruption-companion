# 5. Objetivos de valor medibles (KPI)

## 5.1 ¿Qué número tiene que mejorar?
> **Tiene que bajar la tasa de contacto al call center después de una disrupción (OV-1), sin que suba
> la tasa de recomendaciones incorrectas (OV-2).**

Se definen dos objetivos: uno de **resultado** (lo que gana el negocio) y uno de **límite** (lo que no
se puede perder para ganarlo). Medir sólo el primero empujaría a automatizar de más.

Las metas son **supuestos**: el enunciado no entrega una línea base (H-16, H-19). La V1 deja lista la
instrumentación, y la meta definitiva se fija con la línea base real y con la economía del documento 10.

## 5.2 Árbol de indicadores

```
Objetivos estratégicos      KPI de resultado (rezagados)          Indicadores adelantados (desde el día 1)
─────────────────────       ───────────────────────────           ─────────────────────────────────────
OE-1 Costo de atención  ──► OV-1 Tasa de contacto post-disrupción ◄── IA-1 Resolución sin derivación
                                                                   ◄── IA-2 Tiempo a la información
                                                                   ◄── IA-3 Aceptación de la recomendación
OE-2 Costo del error    ──► OV-2 Tasa de recomendación incorrecta ◄── Límites: acciones sin control = 0
                              (+ acciones sin control = 0)              · % UNVERIFIED · PII en logs = 0
OE-3 Operación humana   ──► (secundario)                          ◄── IA-4 Calidad de la derivación
OE-4 Confianza          ──► (secundario, encuesta en disrupción)  ◄── IA-2, IA-3
```

Los KPI de resultado tardan días en leerse, porque dependen del cruce con el call center y con los
reclamos. Los indicadores adelantados salen del registro de decisiones en tiempo real y avisan antes
si el producto va bien o mal encaminado.

---

## 5.3 OV-1 · Contención: reducir los contactos evitables al call center (resultado)

**Pregunta que responde:** ¿el pasajero resolvió su duda sin llamar?

| Campo | Definición |
|---|---|
| Métrica | **Tasa de contacto después de la disrupción** |
| Fórmula | `reservas con modificación relevante que contactan al call center dentro de las 24 h siguientes a la respuesta` ÷ `reservas con modificación relevante atendidas por el Companion` |
| Comparación | Contra un grupo de control (reservas con disrupción que no usaron el Companion) o contra la línea base histórica |
| Exclusiones | Los contactos que el propio Companion originó al derivar (`create_human_case`): son **derivaciones correctas**, no fallas |
| Fuente del dato | Registro de decisiones del Companion (reserva seudonimizada y hora) cruzado con el registro de contactos del call center |
| Meta (Supuesto) | −20 % frente a la línea base en el primer trimestre |
| Lectura | Semanal, por tipo de modificación (retraso, conexión perdida) |
| Impacto financiero | `contactos evitados × costo por contacto` (documento 10) |

La ventana de 24 h cubre la decisión del pasajero antes de su nuevo vuelo. Es una propuesta.

## 5.4 OV-2 · Exactitud: recomendaciones correctas y acciones bajo control (límite)

**Pregunta que responde:** ¿lo que el Companion dijo o hizo era correcto?

| Campo | Definición |
|---|---|
| Métrica principal | **Tasa de recomendación incorrecta** |
| Fórmula | `respuestas automáticas corregidas, revertidas o reclamadas dentro de las 72 h` ÷ `respuestas automáticas emitidas` |
| Indicador absoluto asociado | **Acciones de alto impacto sin control**: `create_rebooking_request` sin idempotency key, sin `policy_ref` vigente o sin la aprobación que exige la regla. **Meta: 0** |
| Fuente del dato | Registro de decisiones + resultado del caso humano (si el agente cambió la recomendación) + reclamos asociados a la reserva |
| Meta | **Se deriva de la economía, no se elige.** Tiene que quedar por debajo del punto de equilibrio entre el ahorro por contacto y el costo por error (documento 10, §10.5). El 1 % inicial es sólo un marcador |
| Si se supera | Se reduce lo que se resuelve en automático (más casos a una persona) hasta encontrar la causa |

---

## 5.5 Indicadores adelantados

| ID | Indicador | Fórmula | Qué anticipa | Señal de alerta |
|---|---|---|---|---|
| IA-1 | **Resolución sin derivación** | `consultas con next_step ACCEPT_OPTION o NO_ACTION_NEEDED` ÷ `consultas` | OV-1: sin resolución automática no hay contención | Muy bajo: no hay contención. Cerca del 100 %: posible exceso de automatización (revisar OV-2) |
| IA-2 | **Tiempo a la información** | p50 y p95 de `respuesta al pasajero − recorded_at del evento relevante` | OE-4 y OV-1: una respuesta tardía no evita la llamada | p95 cercano a la vigencia de las opciones |
| IA-3 | **Aceptación de la recomendación** | `solicitudes de cambio creadas` ÷ `respuestas con ACCEPT_OPTION` | La recomendación sirve de verdad | Baja aceptación: la opción no convence o el mensaje no se entiende |
| IA-4 | **Calidad de la derivación** | `casos humanos resueltos sin volver a contactar al pasajero` ÷ `casos humanos creados` (y el tiempo medio de atención del caso) | OE-3: la evidencia sirve | El agente vuelve a preguntar lo que estaba en la evidencia |

## 5.6 Límites que se vigilan siempre
| Límite | Meta | Por qué |
|---|---|---|
| Acciones de alto impacto sin control | 0 | No es negociable |
| Datos personales en registros | 0 | Protección de datos |
| Respuestas `UNVERIFIED` | Se observa la tendencia | Mide la salud de las fuentes: si sube, el problema está en los datos, no en el producto |
| Latencia p95 | Menor a 3 s | Restricción de latencia |
| Costo por interacción | Se observa | Casi nulo: no hay IA en runtime (ADR-009) |

## 5.7 Instrumentación mínima en la V1
Un registro por consulta, sin datos personales:

```
decision_id, booking_ref (seudónimo), timestamp,
relevant_change (sí/no + event_ids + recorded_at del evento relevante), policy_ref + rule_ids aplicadas,
outcome (NO_ACTION | INFORM | RECOMMEND | ACTION_REQUESTED | ESCALATED), next_step,
option_id recomendada, human_case_id + reason, request_id, notification_id,
data_quality (completeness, fuentes degradadas, conflictos descartados)
```

Con ese registro se calculan IA-1 a IA-3 y los límites sin construir analítica en la V1. OV-1, OV-2 e
IA-4 necesitan además cruzarse con el call center, los reclamos y los casos humanos.
