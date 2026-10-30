# 6. Atributos funcionales

> Cada capacidad (FN) se traza a la capacidad de negocio del enunciado (C1…C4 de
> `01-definicion-negocio.md`) y a la regla que la gobierna. Son la base para las HU de `backlog/`.

## Funcionales

| ID | Capacidad | Negocio | Regla | Criterio de aceptación resumido |
|---|---|---|---|---|
| FN-01 | **Consultar contexto del viaje** por `booking_id` | C1 | RN-05, RN-06 | Devuelve pasajeros (sin PII innecesaria), segmentos y condiciones; informa `completeness` y `missing_fields` |
| FN-02 | **Consolidar eventos operacionales** por segmento | C2 | RN-05 | Cada evento conserva `source` y `recorded_at`; se marcan fuentes degradadas; conflictos detectados y resueltos según H-05 o derivados |
| FN-03 | **Clasificar la modificación** (relevante / informativa / sin cambio) | C2 | H-01 ❓ | 💡 Relevante = activa una regla de política o afecta una conexión; `GATE_CHANGE` = informativa |
| FN-04 | **Calcular impacto en el itinerario** | C2 | H-06, H-07 ❓ | Nueva llegada estimada por segmento; detecta conexión perdida contra la salida del siguiente segmento |
| FN-05 | **Evaluar la política vigente** | C3 | RN-01 | Usa sólo la versión vigente; devuelve `rule_id` y `entitlement` aplicados y si `requires_human_approval` |
| FN-06 | **Filtrar opciones candidatas** | C3 | RN-02, H-08 ❓ | Descarta opciones: vencidas (TTL), sin asientos para todo el grupo, con costo que contradice el entitlement, contrarias a la tarifa |
| FN-07 | **Construir la recomendación** | C3 | RN-01, RN-04 | Qué pasó + qué implica + siguiente paso; siempre con `policy_ref`; sin opciones descartadas |
| FN-08 | **Decidir el canal: automático o humano** | C4 | RN-03, H-03/H-04 ❓ | 💡 Humano si: regla con aprobación, conflicto no resuelto, dato crítico faltante, ninguna opción viable, 503 sin reconciliar |
| FN-09 | **Iniciar rebooking controlado** | C4 | RN-03 | Sólo con opción viable y confirmación explícita del pasajero; idempotency key determinística; 409 y 503 manejados |
| FN-10 | **Derivar a humano con evidencia** | C4 | RN-03, RN-06 | Caso con motivo, eventos, regla y opciones evaluadas; sin PII que el agente no necesita; se informa al pasajero `sla_minutes` |
| FN-11 | **Notificar al pasajero** | C2–C4 | RN-04 | Sólo contenido validado y con `policy_ref`; 202 se registra como "encolada", no como "entregada"; 422 nunca se reintenta sin corregir |
| FN-12 | **Trazar cada decisión** | Transversal | RN-01, RN-06 | Un registro por consulta en el decision log (ver `05-objetivos-medibles.md`) |
| FN-13 | **Degradar de forma segura** | Transversal | RN-05 | Si falla una tool de lectura o falta la política: no se recomienda; se informa lo verificado y se deriva (H-11 ❓) |

## No funcionales

| ID | Atributo | Requisito V1 💡 | Por qué |
|---|---|---|---|
| NF-01 | Latencia | p95 < 3 s para la respuesta al pasajero; lecturas independientes en paralelo | Restricción de latencia del enunciado |
| NF-02 | Costo por interacción | Núcleo sin llamadas a modelo; si hay IA (D-03), una sola llamada acotada por consulta | Restricción de costo y dependencia de modelos |
| NF-03 | Idempotencia | Toda escritura reintentable sin duplicar efectos | RN-03 |
| NF-04 | Seguridad | Mínimo privilegio por componente: quien lee no escribe; sólo el orquestador llama tools de escritura | RN-06 |
| NF-05 | Privacidad | PII fuera de logs, prompts y fixtures nuevos | RN-06 |
| NF-06 | Observabilidad | `decision_id` correlaciona lecturas, escrituras y respuesta | Operable por equipo pequeño |
| NF-07 | Testabilidad | Toda la lógica de decisión es función pura sobre las respuestas de las tools; los fixtures del enunciado son la suite base | Verificar al menos una decisión relevante (Entregable 1) |
| NF-08 | Extensibilidad | Nuevo escenario = nueva política + evaluador registrado, sin tocar el orquestador | Escalabilidad sin complejizar la V1 |
