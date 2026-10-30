Como evaluador de la industria aeronáutica en Latinoamérica (LATAM) —acostumbrado a operar en un entorno con normativas locales estrictas de protección al pasajero (como las de la Aerocivil en Colombia, la ANAC en Brasil, la JAC en Chile o la AFAC/PROFECO en México) y sistemas legacy heterogéneos—, analizaría el **Disruption Companion** evaluando su capacidad para resolver contingencias operacionales sin generar riesgos financieros ni regulatorios.

---

### 1. Criterios de Evaluación de Calidad

Para validar este producto, evaluaría la calidad en cuatro dimensiones clave:

*   **Exactitud e Integridad de Datos (Data Integrity & Freshness):**
    *   **Consistencia de fuentes:** Un evento de disrupción suele generar datos contradictorios entre sistemas de operaciones (`OPS_CORE`), información de aeropuertos (`AIRPORT_FEED`) y sistemas legados (`LEGACY_MIRROR`). Se debe verificar que el sistema controle marca de tiempo (*timestamp*), fuente y frescura antes de comunicar algo al pasajero.
    *   **Transparencia de metadata:** Evaluar si el sistema maneja respuestas con datos parciales o fuentes degradadas de forma limpia sin asumir información inexistente.
*   **Seguridad y Control en Acciones de Alto Impacto:**
    *   **Determinismo vs. IA:** Reagendar un vuelo o emitir un reembolso son decisiones financieras y operacionales sensibles. Evaluaría que el motor mantenga una lógica determinística estricta respaldada en reglas versionadas y verificables (`get_policy_rules`), evitando que un modelo generativo tome la decisión de cambio por sí solo.
    *   **Idempotencia e integración:** Garantizar el uso estricto de claves de idempotencia (`idempotency_key`) en operaciones de reescritura para prevenir doble reserva o cargos duplicados, además de manejar adecuadamente los fallos o *timeouts* de sistemas *upstream*.
*   **Cumplimiento Regulatorio y Humano en el Bucle (Human-in-the-Loop):**
    *   **Validación de notificaciones:** Ningún mensaje debe ser enviado si carece de validación o referencia a la política aplicable (`policy_ref`), evitando multas por falsas promesas.
    *   **Escalamiento obligatorio:** Verificar que los casos complejos —como solicitudes de compensación monetaria en efectivo o grupos con menores de edad (`group_includes_minor`)— requieran aprobación humana obligatoria (`requires_human_approval: true`) y generen un caso con su SLA correspondiente (`create_human_case`).
*   **Protección de Datos Sensibles (PII):**
    *   Manejo adecuado bajo principio de mínimo privilegio de datos del pasajero (DNI/RUT, pasaporte, correo, teléfono).

---

### 2. Propuesta de OKRs (Objetivos y Resultados Clave)

Para medir el desempeño del producto en un entorno aeronáutico real, propondría los siguientes OKRs:

#### **Objetivo 1: Reducir la fricción operacional y el volumen de atención en canales costosos durante contingencias.**
*   **KR 1.1:** Lograr que un **60% o más** de los pasajeros impactados por demoras o cancelaciones autogestionen o consulten su alternativa a través de la solución (Self-Service Rate en disrupción).
*   **KR 1.2:** Reducir en un **25%** las llamadas entrantes al Call Center y las filas en el mostrador del aeropuerto por conceptos de información sobre modificaciones de vuelo.

#### **Objetivo 2: Garantizar cero errores en la comunicación de políticas y derechos del pasajero.**
*   **KR 2.1:** Mantener en **0%** la tasa de notificaciones rechazadas por falta de validación de políticas o datos erróneos (`UNVALIDATED_CONTENT`).
*   **KR 2.2:** Alcanzar un **100%** de ejecución idempotente exitosa en transacciones de rebooking y emisión de opciones.

#### **Objetivo 3: Ofrecer una resolución oportuna en escalamientos a personal de tierra/call center.**
*   **KR 3.1:** Mantener el cumplimiento del SLA de resolución para casos derivados a atención humana (`DISRUPTION_L2`) por debajo de los **45 minutos** estipulados.
*   **KR 3.2:** Incrementar en **+15 puntos el CSAT/NPS** específico del segmento de pasajeros que sufrieron disrupción operacional.

---

### 3. Aporte de Valor (Value Creation & ROI)

Desde el punto de vista del negocio y la operación en LATAM, el valor de este producto se concentra en:

1.  **Ahorro Financiero Directo (Cost Containment):**
    *   **Reducción del costo por contacto:** Atender a un pasajero en Call Center o en el aeropuerto durante una disrupción masiva tiene un costo significativamente alto. Reducir los contactos evitables libera recursos y mitiga la saturación del personal de tierra.
    *   **Prevención de multas y reclamos:** Aplicar las reglas de compensación y asistencia (comida, hotel, reubicación) exactamente como marca la regulación evita infracciones impuestas por las autoridades aeronáuticas.
2.  **Valor para el Pasajero (Customer Experience):**
    *   Disminución drástica de la incertidumbre: El pasajero obtiene visibilidad inmediata de lo sucedido y una ruta clara de acción en su dispositivo sin hacer filas de horas en el aeropuerto.
3.  **Eficiencia Operacional y Trazabilidad:**
    *   Al derivar un caso a un agente humano, el sistema adjunta el motivo y la evidencia previa acumulada (`reason`, `evidence`), reduciendo el tiempo medio de atención por agente y permitiendo auditar cada decisión tomada.

---

💡 **¿Te gustaría que profundicemos en la especificación técnica de algún flujo (por ejemplo, cómo estructurar las reglas de idempotencia y reintento frente a un *UPSTREAM_TIMEOUT* en el rebooking)?**