# 4. Atributos de valor

> Qué cualidades hacen que el producto valga para el pasajero y para el negocio. Cada atributo
> tiene un **mecanismo que lo protege** en el diseño y una **señal** que permite verificarlo.

| # | Atributo | Para quién | Qué significa | Mecanismo que lo protege | Señal observable |
|---|---|---|---|---|---|
| AV-1 | **Claridad** | Pasajero | Entiende qué pasó y qué implica en lenguaje simple, sin jerga ni datos internos | Mensajes por plantilla; no se exponen `confidence`, fuentes internas ni IDs técnicos (💡 H-02) | Contactos post-notificación con la pregunta "¿qué pasó?" |
| AV-2 | **Accionabilidad** | Pasajero | Siempre hay un siguiente paso concreto: aceptar opción, esperar agente o no hacer nada | Toda respuesta termina en un `next_step`; derivar a humano también es un siguiente paso | % de respuestas sin siguiente paso (meta: 0) |
| AV-3 | **Veracidad** | Pasajero y negocio | Nada se afirma sin dato verificado, fresco y consistente | Validación de frescura, fuente y conflicto (RN-05); `notify_passenger` exige `policy_ref` (RN-04) | Mensajes corregidos después de enviados |
| AV-4 | **Cumplimiento de política** | Negocio | Se otorga lo que dice la política vigente, ni más ni menos | Evaluación determinística contra la versión vigente; versiones superseded rechazadas (RN-01) | Recomendaciones revertidas por operación |
| AV-5 | **Control del alto impacto** | Negocio | Ninguna reserva ni compensación cambia sin el control que corresponde | Idempotency key, 503 = indeterminado, aprobación humana cuando la regla lo pide (RN-03) | Acciones de alto impacto sin control (meta: 0) |
| AV-6 | **Trazabilidad** | Negocio y operación | Toda decisión se reconstruye: qué datos, qué regla, qué versión, quién aprobó | Decision log por consulta con `policy_ref`, `rule_id`, `event_id` y timestamps | % de decisiones con traza completa (meta: 100 %) |
| AV-7 | **Privacidad** | Pasajero | Sus datos se usan sólo para lo necesario | Mínimo privilegio por componente; PII fuera de logs y prompts (RN-06) | PII detectada en logs (meta: 0) |
| AV-8 | **Continuidad / degradación segura** | Pasajero y operación | Si una fuente falla, el pasajero igual recibe un siguiente paso seguro | Ante falla o duda, se deriva a humano en vez de responder a ciegas | Respuestas fallidas sin derivación (meta: 0) |
| AV-9 | **Operabilidad** | Equipo | Lo opera un equipo pequeño | Lógica determinística testeable, pocas piezas, un solo log de decisiones | Tiempo de diagnóstico de un caso desde el log |

## Tensiones entre atributos (y cómo se resuelven)
- **Accionabilidad vs Veracidad:** si no hay dato confiable, el siguiente paso es "te contacta un
  agente", no una recomendación débil. Gana Veracidad.
- **Claridad vs Trazabilidad:** la traza completa va al log y al caso humano; al pasajero, sólo lo necesario.
- **Velocidad vs Control:** lo informativo puede ser automático; lo de alto impacto espera control.
