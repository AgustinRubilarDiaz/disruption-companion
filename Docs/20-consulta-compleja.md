# 20 · Consulta ambigua o compleja (§5.2 del enunciado)

Cómo se maneja una consulta que obliga a combinar reserva, eventos operacionales y políticas: cómo se
descompone, qué contexto se recupera, qué queda determinístico, qué haría la IA o un agente, y dónde
se detiene para pedir intervención humana.

## 20.1 La consulta

> *"Mi vuelo está atrasado, ¿pierdo la conexión? Viajo con mi hijo y quiero que me compensen."*

Mezcla tres cosas: un **hecho a verificar** (¿hay retraso y se pierde la conexión?), un **derecho a
calcular** (¿qué le corresponde?) y una **petición de alto impacto** (compensación en dinero).
Además, el dato del retraso viene de fuentes que se contradicen (`OPS_CORE` dice 160 min y
`LEGACY_MIRROR`, degradada, dice `ON_TIME`).

## 20.2 Descomposición

| # | Subtarea | Contexto que recupera | Clasificación | Dónde se detiene |
|---|---|---|---|---|
| 1 | Identificar la intención | La consulta del pasajero | Determinístico: opciones cerradas ("revisar mi conexión", "pedir compensación", "hablar con una persona") | Si ninguna opción calza → persona |
| 2 | Recuperar el viaje | `get_trip_context`: segmentos, tipos de pasajero, tarifa, `completeness`. Nunca nombres, correos ni documentos hacia afuera | Determinístico | Falla de lectura → `READ_FAILURE`, persona |
| 3 | Verificar el hecho | `get_operational_events`: fuente, `recorded_at`, fuentes degradadas | Determinístico (ADR-003): se descartan las degradadas y las viejas; conflicto entre sanas → `UNVERIFIED` | Conflicto → `SOURCE_CONFLICT`, persona; nunca "sin cambios" |
| 4 | Calcular el impacto | Llegada estimada de S1 frente a la salida de S2 + MCT | Determinístico | — |
| 5 | Calcular el derecho | `get_policy_rules("DELAY")`, versión vigente | Determinístico (ADR-004): R3 (conexión perdida), R4 (compensación pedida), R5 (menor) | Condición que no entiende → `UNSUPPORTED_RULE`, persona |
| 6 | Elegir la opción | `get_eligible_options`, filtrada contra política, grupo y vigencia | Determinístico: una sola opción, la viable para todo el grupo | Ninguna viable → `NO_VIABLE_OPTION`, persona |
| 7 | Decidir quién actúa | Bandera `requires_human_approval` de cada regla | Determinístico (RN-07): R3 sigue en automático; R4 y R5 requieren aprobación | **R4 y R5 → persona, en paralelo** |
| 8 | Responder | Plantilla cerrada con `policy_ref` | Determinístico | Sin `policy_ref` → no se envía (422) |

## 20.3 Resultado para la consulta
- **Lo verificado se responde igual:** "Tu vuelo LA500 sale a las 17:10 y no alcanzas tu conexión.
  Te ofrecemos LA2412 del 16-09 a las 08:15, sin costo."
- **Lo que requiere aprobación queda en manos de una persona:** la compensación (R4) y la atención
  prioritaria por el menor (R5) abren casos con evidencia, sin bloquear el cambio de vuelo.
- El pasajero acepta la opción con confirmación explícita. La solicitud queda "pendiente de
  confirmación", nunca "confirmada".

## 20.4 Dónde aportaría la IA (no implementado, ADR-009)

| Uso | Clasificación | Control | Por qué no está en la V1 |
|---|---|---|---|
| Entender la consulta en texto libre (HU-009) | AI-assisted | Catálogo cerrado de intenciones; con baja confianza se muestran opciones cerradas o se deriva; se enmascaran correos, teléfonos y documentos antes de enviar el texto | Las opciones cerradas cubren el caso sin riesgo de interpretación |
| Resumir la evidencia para el agente L2 | AI-assisted | El resumen acompaña a la evidencia estructurada, no la reemplaza | La evidencia estructurada ya es legible |
| Orquestar las tools según la consulta | Agentic | — | **No se justifica:** el orden de las tools es fijo y conocido; un agente agrega no determinismo sin beneficio |

**Nunca con IA:** calcular derechos, elegir la opción, decidir si interviene una persona o escribir
en sistemas. Son decisiones de política, testeables y con costo alto si fallan.

Si se agrega el intérprete de intención, entra **antes** de la subtarea 1, sin acceso a escrituras
ni a datos personales, y se valida en modo sombra contra lo que el pasajero elige con las opciones
cerradas.

## 20.5 Cómo se detecta un resultado incorrecto
- Las 10 invariantes del contrato se verifican antes de responder. Por ejemplo, un viaje
  `UNVERIFIED` nunca lleva opción recomendada, no hay mensaje sin `policy_ref`, y el mensaje no puede
  afirmar nada que la evaluación no sostenga.
- La ausencia de datos se trata como `UNVERIFIED`, nunca como "sin cambios".
- Cada decisión queda en el registro con las reglas evaluadas, los eventos usados y descartados, y
  las opciones descartadas con su motivo (HU-008).
