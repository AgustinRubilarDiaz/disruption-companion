# 5. Objetivos de valor medibles

> Dos objetivos: uno de **resultado** (lo que el negocio gana) y uno de **guardarraíl** (lo que no
> se puede perder para ganarlo). Medir sólo el primero empujaría a automatizar de más.
> Las metas son 💡 **hipótesis**: no hay baseline en el enunciado (ver H-16). La V1 deja la
> instrumentación lista; la meta se fija con el baseline real.

---

## OV-1 · Contención: reducir contactos evitables al call center (resultado)

**Pregunta que responde:** ¿el pasajero resolvió su duda sin llamar?

| Campo | Definición |
|---|---|
| Métrica | **Tasa de contacto post-disrupción** |
| Fórmula | `bookings con modificación relevante que contactan al call center dentro de 24 h desde la respuesta del Companion` ÷ `bookings con modificación relevante atendidos por el Companion` |
| Comparación | Contra un grupo de control (bookings con disrupción que no usaron el Companion) o contra el baseline histórico |
| Exclusiones | Contactos que el propio Companion originó al derivar (`create_human_case`): esos son **derivaciones correctas**, no fallas |
| Fuente del dato | Decision log del Companion (`booking_id` seudonimizado, timestamp) cruzado con el registro de contactos del call center |
| Meta 💡 | −20 % frente al baseline en el primer trimestre |
| Corte de lectura | Semanal, por tipo de modificación (DELAY, conexión perdida) |

**Por qué 24 h:** la ventana cubre la decisión del pasajero antes de su nuevo vuelo. Es una propuesta.

---

## OV-2 · Exactitud: recomendaciones correctas y acciones bajo control (guardarraíl)

**Pregunta que responde:** ¿lo que el Companion dijo o hizo era correcto?

| Campo | Definición |
|---|---|
| Métrica principal | **Tasa de recomendación incorrecta** |
| Fórmula | `respuestas automáticas corregidas, revertidas o reclamadas dentro de 72 h` ÷ `respuestas automáticas emitidas` |
| Métrica dura asociada | **Acciones de alto impacto sin control** = `create_rebooking_request` sin idempotency key, sin `policy_ref` vigente, o sin aprobación cuando la regla la exige. **Meta: 0 (absoluta)** |
| Fuente del dato | Decision log + resultado del caso humano (si el agente cambió la recomendación) + reclamos asociados al `booking_id` |
| Meta 💡 | ≤ 1 % de recomendación incorrecta; 0 acciones sin control |
| Acción si se supera | Se reduce el perímetro automático (más casos a humano) hasta encontrar la causa |

---

## Cómo se instrumenta en la V1 (mínimo)
Un registro por consulta en el **decision log**, sin PII (RN-06):

```
decision_id, booking_ref (seudónimo), timestamp,
relevant_change (sí/no + event_ids), policy_ref + rule_ids aplicadas,
outcome (NO_ACTION | INFORM | RECOMMEND | ACTION_REQUESTED | ESCALATED),
option_id recomendada, human_case_id, request_id, notification_id,
data_quality (completeness, fuentes degradadas, conflictos descartados)
```

Con eso se calculan ambos objetivos sin construir un sistema de analítica en la V1.

## Métricas de soporte (no son objetivos, se observan)
- Latencia p95 de la respuesta al pasajero.
- % de consultas derivadas a humano (si sube mucho, OV-1 no mejora; si baja a 0, OV-2 está en riesgo).
- Costo por interacción (relevante sólo si se usa IA en runtime, D-03).
