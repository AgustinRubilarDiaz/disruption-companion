Como evaluador del comité técnico para el caso **Disruption Companion**, mi función en la sesión de debate (los 35-40 minutos posteriores a tu presentación de 10 minutos) no es verificar si la aplicación está terminada, sino presionar sobre las costuras de tu arquitectura, tus decisiones de diseño y tu criterio de ingeniería bajo la restricción de 3 horas efectivas.

A continuación, presento la batería de preguntas críticas alineadas estrictamente con las reglas, restricciones y herramientas del desafío:

---

### **Bloque 1: Arquitectura, Lógica Determinística vs. IA y Control Humano**

1. **Límites de la IA y Prevención de Alucinaciones:**
   * *Pregunta:* En las restricciones del caso se especifica que una recomendación incorrecta o un mensaje erróneo genera costos, reclamos o incumplimiento de políticas. Si decidiste usar un LLM o agente en *runtime*: **¿Cómo garantizas de forma estricta que la respuesta al pasajero nunca emita un `422 UNVALIDATED_CONTENT` por falta de `policy_ref` en `notify_passenger`?** Si tu solución es 100% determinística, ¿cuál es el contrato exacto entre el motor de reglas de política (`get_policy_rules`) y el generador de mensajes?
2. **Criterios de Escalamiento Humano (`create_human_case`):**
   * *Pregunta:* La política `POL-DELAY-2026-03` exige aprobación humana obligatoria (`requires_human_approval: true`) si hay una solicitud de compensación en efectivo (`R4`) o si el grupo incluye a un menor de edad (`R5`). En tu diseño: **¿Dónde se interrumpe la ejecución automática?** Si la IA o el backend detecta a un menor (`CHILD`) en el itinerario, ¿qué respuesta se le entrega de inmediato al pasajero mientras se genera el caso con SLA de 45 minutos en la cola `DISRUPTION_L2`?

---

### **Bloque 2: Integridad de Datos, Fuentes Degradadas y Fallos Indeterminados**

3. **Manejo de Contradicciones y Frescura de Datos:**
   * *Pregunta:* Los datos de ejemplo muestran que para el segmento `S1`, `OPS_CORE` reporta un retraso de 160 min (`recorded_at: 10:48:00Z`), mientras que `LEGACY_MIRROR` (fuente marcada como degradada) reporta `ON_TIME` (`recorded_at: 09:30:00Z`). Además, la respuesta del viaje indica `completeness: "PARTIAL"` por falta del monto de penalización. **¿Cómo resuelve tu código esta discrepancia de fuentes?** ¿Qué algoritmo o lógica de prioridad/frescura (`timestamp`) implementaste para evitar mostrar un estado falso al usuario?
4. **Resiliencia en Acciones de Alto Impacto (`503 UPSTREAM_TIMEOUT`):**
   * *Pregunta:* La tool `create_rebooking_request` advierte que ante un error `503 UPSTREAM_TIMEOUT`, el resultado real en el sistema emisor es **indeterminado**. En tu *vertical slice*: **¿Cómo reacciona tu sistema ante este error?** ¿Reintentas inmediatamente con la misma `idempotency_key`, marcas la transacción en estado pendiente, o escalas a un humano para evitar una doble reserva?

---

### **Bloque 3: Track Elegido, Contratos e Interfaz Complementaria**

5. **Definición de Contratos y Aisles del Track:**
   * *Pregunta:* Si elegiste el **Track Backend**: ¿Cómo definiste la estructura JSON que consume la interfaz para que el cliente no tenga que interpretar eventos crudos ni lidiar con la complejidad de `get_eligible_options`? Si elegiste el **Track Frontend**: ¿Qué supuestos asumiste sobre la latencia y la caducidad (`ttl_seconds: 120`) de las opciones de rebooking para evitar que el pasajero seleccione una opción cuya disponibilidad ya venció?

---

### **Bloque 4: Criterio de Ingeniería, Trade-offs en 3 Horas y Gobierno de IA**

6. **Priorización y Deuda Técnica Deliberada:**
   * *Pregunta:* El desafío daba un límite estricto de 3 horas efectivas de trabajo. **¿Qué fue lo primero que decidiste *no* construir o dejar mockeado y por qué?** Si tuvieras 3 horas adicionales antes de pasar a producción, ¿cuál es el único riesgo de seguridad o fiabilidad que resolverías primero?
7. **Gobierno en el uso de IA y Seguridad de PII (Entregable 3):**
   * *Pregunta:* En tu *AI Usage & Decision Note*: **¿Qué código u output generado por IA rechazaste o reescribiste personalmente porque introducía un riesgo o mala práctica?** Y respecto a la privacidad: ¿Qué datos personales del pasajero (`document_id`, correo, teléfono) aislaste completamente para garantizar que jamás sean enviados al prompt o contexto de un modelo de lenguaje externo?

---

💬 **¿Te gustaría simular la defensa de alguno de estos puntos en particular (por ejemplo, cómo defenderías el manejo del error `503 UPSTREAM_TIMEOUT` o la resolución de fuentes contradictorias)?**