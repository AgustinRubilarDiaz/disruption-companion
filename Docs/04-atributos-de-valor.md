# 4. Atributos de valor

Qué cualidades hacen que el producto valga para el pasajero y para el negocio. Cada atributo tiene un
**mecanismo que lo protege** en el diseño y una **señal** que permite verificarlo.

| # | Atributo | Para quién | Qué significa | Mecanismo que lo protege | Señal observable |
|---|---|---|---|---|---|
| AV-1 | **Claridad** | Pasajero | Entiende qué pasó y qué implica, en lenguaje simple, sin jerga ni datos internos | Mensajes por plantilla; no se exponen `confidence`, fuentes internas ni IDs técnicos (Supuesto, H-02) | Contactos después de la notificación que preguntan "¿qué pasó?" |
| AV-2 | **Accionabilidad** | Pasajero | Siempre hay un siguiente paso concreto: aceptar una opción, esperar a un agente o no hacer nada | Toda respuesta termina en un siguiente paso; derivar a una persona también lo es | Respuestas sin siguiente paso (meta: 0) |
| AV-3 | **Veracidad** | Pasajero y negocio | Nada se afirma sin un dato verificado, fresco y consistente | Validación de frescura, fuente y conflicto; `notify_passenger` exige `policy_ref` | Mensajes corregidos después de enviados |
| AV-4 | **Cumplimiento de política** | Negocio | Se otorga lo que dice la política vigente, ni más ni menos | Evaluación determinística contra la versión vigente; las versiones reemplazadas se rechazan | Recomendaciones revertidas por operación |
| AV-5 | **Control del alto impacto** | Negocio | Ninguna reserva ni compensación cambia sin el control que corresponde | Idempotency key; el 503 se trata como resultado indeterminado; aprobación humana cuando la regla lo pide | Acciones de alto impacto sin control (meta: 0) |
| AV-6 | **Trazabilidad** | Negocio y operación | Toda decisión se puede reconstruir: qué datos, qué regla, qué versión y quién aprobó | Registro por consulta con `policy_ref`, `rule_id`, `event_id` y horas | Decisiones con traza completa (meta: 100 %) |
| AV-7 | **Privacidad** | Pasajero | Sus datos se usan sólo para lo necesario | Mínimo privilegio por componente; datos personales fuera de logs y de prompts a modelos | Datos personales encontrados en logs (meta: 0) |
| AV-8 | **Degradación segura** | Pasajero y operación | Si una fuente falla, el pasajero igual recibe un siguiente paso seguro | Ante una falla o una duda, se deriva a una persona en vez de responder a ciegas | Respuestas fallidas sin derivación (meta: 0) |
| AV-9 | **Operabilidad** | Equipo | Lo puede operar un equipo pequeño | Lógica determinística testeable, pocas piezas y un único registro de decisiones | Tiempo para diagnosticar un caso desde el registro |

## Tensiones entre atributos
- **Accionabilidad frente a veracidad:** si no hay un dato confiable, el siguiente paso es "te
  contacta un agente", no una recomendación débil. Gana la veracidad.
- **Claridad frente a trazabilidad:** la traza completa va al registro y al caso humano; al pasajero
  le llega sólo lo necesario.
- **Velocidad frente a control:** lo informativo puede ser automático; lo de alto impacto espera control.
