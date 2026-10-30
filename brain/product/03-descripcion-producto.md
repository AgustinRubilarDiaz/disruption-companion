# 3. Descripción del producto

## Qué es
**Disruption Companion** es un servicio que, dado un `booking_id`, **combina la reserva, los eventos
operacionales y la política vigente** para responderle al pasajero tres preguntas:

1. **¿Qué pasó?** La modificación relevante de su viaje, con el dato verificado y su hora de corte.
2. **¿Qué me implica?** El impacto en su itinerario (por ejemplo, una conexión perdida) y lo que la política le otorga.
3. **¿Qué hago ahora?** Una opción accionable, una acción controlada o la derivación a una persona.

## Cómo funciona
```
booking_id ─► Recuperar ─► Verificar ─► Evaluar política ─► Decidir canal ─► Comunicar / Actuar / Derivar
              (sistemas     (frescura,    (reglas            (automático       (siempre con
               de lectura)   fuente,       versionadas,       o persona)        policy_ref y traza)
                             conflicto)    determinístico)
```
El detalle está en el documento 8.

## Alcance de la V1 (Supuesto)
| Incluye | Queda para próximos pasos |
|---|---|
| Escenario `DELAY` (la única política del enunciado), incluida la conexión perdida | Cancelación, cambio de equipo, desvío (sin política ni tipo de evento especificado) |
| Consulta por `booking_id` para el grupo completo | Gestión individual de cada pasajero dentro del grupo |
| Recomendación de cambio de vuelo sin costo, filtrada contra la política y el grupo | Compensación en dinero automática (la regla R4 exige una persona) |
| Solicitud de cambio de vuelo controlada (idempotente, pendiente de confirmación) | Confirmación y emisión final del nuevo ticket |
| Derivación a una persona con evidencia mínima | Chat libre de varios turnos |
| Notificación sólo con contenido validado (`policy_ref`) | Varios canales (el contrato sólo muestra `PUSH`) |
| Registro de cada decisión, sin datos personales | Dashboard de métricas (se calculan desde el registro) |

## Qué es determinístico y qué es humano (decidido: sin IA en runtime, ADR-009)
| Paso | Clasificación | Por qué |
|---|---|---|
| Recuperar datos y validar frescura y fuente | Determinístico | Reglas explícitas, auditables y sin costo de modelo |
| Evaluar la política y filtrar opciones | Determinístico | Es donde un error cuesta dinero o reclamos |
| Redactar el mensaje al pasajero | Determinístico (plantilla) | Sólo usa hechos de la evaluación; el `policy_ref` es obligatorio |
| Plantear una consulta compleja ("quiero una compensación") | Determinístico (opciones cerradas) | La selección agrega un hecho; no hay texto libre que interpretar |
| Aprobar R4 o R5, resolver conflictos y resultados indeterminados | Persona | Lo exige la política o el riesgo |

**Por qué no hay IA en runtime:** se esperaba que hiciera más natural la consulta y el mensaje, pero
una alucinación es exactamente el error que el producto tiene que evitar. La alternativa
determinística cubre cada uso, con costo casi nulo y sin exponer datos personales (ADR-009).

## Usuarios y canal
- **Primario:** el pasajero (app o web, notificación `PUSH`).
- **Secundario:** el agente de la cola `DISRUPTION_L2`, que recibe el caso con la evidencia.

## Track del vertical slice
Pendiente (D-01). Esta descripción vale para cualquiera de los dos tracks.
