# 6. Atributos funcionales

Cada capacidad (FN) se traza a una capacidad de negocio del enunciado (C1 a C4, documento 1). Son la
base para escribir las historias de usuario.

## Funcionales

| ID | Capacidad | Negocio | Criterio de aceptación resumido |
|---|---|---|---|
| FN-01 | **Consultar el contexto del viaje** por `booking_id` | C1 | Devuelve pasajeros (sin datos personales innecesarios), segmentos y condiciones de tarifa; informa `completeness` y `missing_fields` |
| FN-02 | **Consolidar los eventos operacionales** por segmento | C2 | Cada evento conserva `source` y `recorded_at`; se marcan las fuentes degradadas; los conflictos se detectan y se resuelven o se derivan (H-05) |
| FN-03 | **Clasificar la modificación** como relevante, informativa o sin cambio | C2 | Supuesto (H-01): es relevante si activa una regla de la política o afecta una conexión; `GATE_CHANGE` es informativo |
| FN-04 | **Calcular el impacto en el itinerario** | C2 | Nueva llegada estimada por segmento; detecta la conexión perdida contra la salida del segmento siguiente (H-06, H-07) |
| FN-05 | **Evaluar la política vigente** | C3 | Usa sólo la versión vigente; devuelve `rule_id`, `entitlement` y si `requires_human_approval` |
| FN-06 | **Filtrar las opciones candidatas** | C3 | Descarta opciones vencidas (TTL), sin asientos para todo el grupo, con un costo que contradice el entitlement o contrarias a la tarifa (H-08) |
| FN-07 | **Construir la recomendación** | C3 | Qué pasó + qué implica + siguiente paso; siempre con `policy_ref`; nunca incluye opciones descartadas |
| FN-08 | **Decidir el canal: automático o persona** | C4 | Supuesto (H-03, H-04): va a una persona si hay una regla con aprobación, un conflicto sin resolver, un dato crítico faltante, ninguna opción viable o un 503 sin reconciliar |
| FN-09 | **Iniciar un cambio de vuelo controlado** | C4 | Sólo con una opción viable y la confirmación explícita del pasajero; idempotency key determinística; manejo de 409 y 503 |
| FN-10 | **Derivar a una persona con evidencia** | C4 | Caso con motivo, eventos, regla y opciones evaluadas; sin datos personales que el agente no necesita; se informa al pasajero el `sla_minutes` |
| FN-11 | **Notificar al pasajero** | C2–C4 | Sólo contenido validado y con `policy_ref`; un 202 se registra como "encolada", no como "entregada"; un 422 nunca se reintenta sin corregir |
| FN-12 | **Registrar cada decisión** | Transversal | Un registro por consulta (documento 5) |
| FN-13 | **Degradar de forma segura** | Transversal | Si falla un sistema de lectura o falta la política, no se recomienda: se informa lo verificado y se deriva (H-11) |

## No funcionales

| ID | Atributo | Requisito V1 (Supuesto) | Por qué |
|---|---|---|---|
| NF-01 | Latencia | p95 menor a 3 s para la respuesta al pasajero; lecturas independientes en paralelo | Restricción de latencia del enunciado |
| NF-02 | Costo por interacción | Ninguna llamada a modelos en runtime (ADR-009) | Restricción de costo y de dependencia de modelos |
| NF-03 | Idempotencia | Toda escritura se puede reintentar sin duplicar efectos | Alto impacto |
| NF-04 | Seguridad | Mínimo privilegio por componente: quien lee no escribe; sólo el orquestador llama a los sistemas de escritura | Mínimo privilegio |
| NF-05 | Privacidad | Datos personales fuera de logs, prompts y datos de prueba nuevos | Protección de datos personales |
| NF-06 | Observabilidad | Un `decision_id` correlaciona lecturas, escrituras y respuesta | Operable por un equipo pequeño |
| NF-07 | Testabilidad | La lógica de decisión es una función pura sobre las respuestas de los sistemas; los ejemplos del enunciado son la suite base | El entregable debe permitir verificar al menos una decisión |
| NF-08 | Extensibilidad | Un escenario nuevo = una política nueva + su evaluador registrado, sin tocar el orquestador | Escalar sin complejizar la V1 |
