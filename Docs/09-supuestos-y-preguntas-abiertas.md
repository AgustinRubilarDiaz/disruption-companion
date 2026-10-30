# 9. Supuestos y preguntas abiertas

Lo que el enunciado no define. Cada pregunta tiene una propuesta para discutir; ninguna se toma como
regla hasta decidirla.

## Decisiones pendientes

| ID | Decisión | Por qué importa |
|---|---|---|
| D-01 | Track: Backend/Integración o Frontend/Experience | **Resuelta: Backend/Integración (ADR-001, 29-10-2026)** |
| D-02 | Stack del vertical slice | Comandos de build y de test |
| D-03 | ¿IA en runtime? Si no se usa, qué beneficio se esperaba y por qué no se justifica | **Resuelta: sin IA en runtime (ADR-009, 29-10-2026)** |
| D-04 | ¿El backend se expone como servicio HTTP o como función invocable? | Forma de la interfaz del documento 16 (§16.1 admite ambas) |
| D-05 | ¿La preparación del entorno de trabajo cuenta dentro de las 3 h efectivas? | Cambia el tiempo disponible y el corte del documento 13 |

## Ambigüedades declaradas por el enunciado

| ID | Pregunta | Propuestas para discutir |
|---|---|---|
| P-01 | ¿Qué es una **modificación relevante**? | (a) todo evento que active una regla de la política; (b) lo anterior más un umbral de minutos; (c) `GATE_CHANGE` es informativo, no relevante |
| P-02 | ¿Qué información puede **ver el pasajero** y cuál no? | Mostrar: estado, horarios, lo que le corresponde y las opciones. No mostrar: fuentes internas, `confidence` ni datos personales de otros pasajeros |
| P-03 | ¿Cuándo una recomendación puede ser **automática**? | Sólo si los datos están frescos y sin conflicto, la regla no exige aprobación y la opción sirve para todo el grupo |
| P-04 | ¿Cuándo interviene **una persona** antes de actuar o comunicar? | R4 y R5, conflicto de fuentes, 503 indeterminado, datos críticos faltantes, ninguna opción viable |
| P-05 | ¿Qué hacer con **fuentes contradictorias**? ¿Qué umbral de frescura? | (a) prioridad por fuente; (b) gana la más reciente; (c) excluir las degradadas; (d) conflicto → persona |

## Detectadas en los datos de ejemplo

| ID | Pregunta | Evidencia |
|---|---|---|
| P-06 | ¿El retraso se mide por segmento o a destino final? | S1 tiene 160 min; con O1 la llegada a MEX pasa al día siguiente |
| P-07 | ¿Cómo se determinan la conexión perdida y el carácter internacional? Faltan el tiempo mínimo de conexión y la **zona horaria** de los horarios | Nueva llegada de S1 ≈ 20:35 y S2 sale a las 19:05 |
| P-08 | ¿Con qué criterio se filtran las opciones candidatas? | O2: 1 asiento para 2 pasajeros y diferencia de 180000 CLP pese al cambio sin costo. O3: reembolso con tarifa no reembolsable y confianza `LOW` |
| P-09 | ¿Qué hacer con un contexto `PARTIAL`? | Falta `change_penalty_amount` |
| P-10 | Las opciones valen 120 s y la solicitud tiene `expires_at`. ¿Quién confirma una solicitud `PENDING_CONFIRMATION`? | `ttl_seconds`, `expires_at` |
| P-11 | ¿Qué pasa si falla un sistema de lectura o la política no está disponible? | El enunciado no especifica errores de lectura |
| P-12 | ¿Cómo se deriva la idempotency key y cómo se reconcilia después de un 503? | `UPSTREAM_TIMEOUT` = resultado indeterminado |
| P-13 | La `condition` de la política es un texto: ¿se interpreta o se mapea a código? | `"delay_minutes >= 240 AND international"` |
| P-14 | ¿De dónde sale `compensation_requested`? ¿Lo pide el pasajero en la conversación? | Regla R4 |
| P-15 | O1 implica pasar la noche en Lima y la política no tiene regla de hotel. ¿Se informa, se deriva o queda fuera de alcance? | O1 sale el 16-09 a las 08:15 |
| P-16 | No hay línea base de contactos al call center ni de reclamos | Las metas de OV-1 y OV-2 son hipótesis |
| P-17 | Si aplican R3 (sin aprobación) y R5 (requiere aprobación) a la vez: ¿se recomienda O1 en automático y se escala R5 en paralelo, o todo el caso va a una persona? | Caso base, documento 8 |

## Detectadas al revisar negocio, AS-IS y sistemas

| ID | Pregunta | Por qué importa |
|---|---|---|
| P-18 | ¿Por qué urge ahora y qué objetivo estratégico tiene asignado el producto (costo de atención, reclamos, experiencia)? | El enunciado no explica la urgencia; define cuál de OE-1 a OE-4 manda ante un conflicto (documento 1) |
| P-19 | Volúmenes y costos: reservas con disrupción al mes, tasa de contacto actual, costo por contacto, tiempo de atención en L2 y costo medio de un reclamo | Sin estos datos no se puede calcular el beneficio ni la meta de error (documento 10) |
| P-20 | ¿Existe hoy algún autoservicio o comunicación de disrupciones? ¿Queda registrado por qué se ofreció una opción? | Define el AS-IS real y la línea base de OV-1 |
| P-21 | ¿La política interna ya incorpora los derechos regulatorios del pasajero en cada país de la ruta (Chile, Perú, México)? | Si no, la política no alcanza para decidir lo que corresponde |
| P-22 | ¿Cómo se entera el sistema de un evento sin que el pasajero consulte? No hay una suscripción a eventos | La V1 sólo responde a consultas; el aviso proactivo necesita un disparador |
| P-23 | O3 cita `POL-REFUND-2026-01`, que no se entrega. ¿Existe esa política? ¿Se consulta con `get_policy_rules("REFUND")`? | Sin la política, el reembolso no se puede validar |
| P-24 | Autenticación, latencia, límites de uso y SLA de cada sistema disponible | Presupuesto de latencia, reintentos y degradación |
| P-25 | ¿`loyalty_tier` o `fare_family` deben influir en la prioridad o en las opciones? Ninguna regla los usa | Evita inventar una regla de priorización |

## Detectadas al evaluar alcance, presupuesto y plazos

| ID | Pregunta | Por qué importa |
|---|---|---|
| P-26 | ¿Hay una fecha tope crítica (temporada alta, contrato con el call center, cambio regulatorio)? | Define cuándo tiene que terminar el modo sombra (documento 13) |
| P-27 | ¿Quiénes validan los avances y con qué disponibilidad (PM, Designer, Team Lead, dueño de políticas, operación L2, legal)? | Sin validadores identificados, las reglas de diseño no se pueden cerrar |
| P-28 | ¿Hay un presupuesto asignado (equipo, infraestructura, costo por interacción)? | Define cuánto puede durar el modo sombra y qué infraestructura se puede sostener |

## A quién preguntaría
- **Negocio / dueño de las políticas:** P-01, P-03, P-04, P-06, P-14, P-15, P-23, P-25.
- **Product Manager:** P-18, P-20, P-26, P-27, P-28.
- **Operaciones / datos operacionales:** P-05, P-07, P-11, P-22.
- **Diseño y legal / privacidad:** P-02, P-21.
- **Plataforma de reservas e integración:** P-08, P-09, P-10, P-12, P-13, P-24.
- **Atención al cliente, analítica y finanzas:** P-16, P-19.
