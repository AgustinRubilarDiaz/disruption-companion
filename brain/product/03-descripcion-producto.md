# 3. Descripción del producto

## Qué es
**Disruption Companion** es un servicio que, dado un `booking_id`, **combina la reserva, los eventos
operacionales y la política vigente** para responderle al pasajero tres preguntas:

1. **¿Qué pasó?** — la modificación relevante de su viaje, con dato verificado y su hora de corte.
2. **¿Qué me implica?** — impacto en su itinerario (p. ej. conexión perdida) y lo que la política le otorga.
3. **¿Qué hago ahora?** — una opción accionable, una acción controlada o la derivación a una persona.

## Cómo funciona (vista de producto)
```
booking_id ─► Recuperar ─► Verificar ─► Evaluar política ─► Decidir canal ─► Comunicar / Actuar / Derivar
              (tools de     (frescura,    (reglas            (automático       (siempre con
               lectura)      fuente,       versionadas,       vs humano)        policy_ref y traza)
                             conflicto)    determinístico)
```
Detalle en `07-flujo.md`.

## Alcance V1 💡
| Incluye | No incluye (próximos pasos) |
|---|---|
| Escenario `DELAY` (única política del enunciado) y su derivado conexión perdida | Cancelación, cambio de equipo, desvío (sin política ni tipo de evento especificado) |
| Consulta por `booking_id` de un grupo completo | Gestión individual por pasajero dentro del grupo |
| Recomendación de rebooking sin costo filtrada contra política y grupo | Compensación en dinero automática (`R4` exige humano) |
| Solicitud de rebooking controlada (idempotente, pendiente de confirmación) | Confirmación/emisión final del ticket |
| Derivación a humano con evidencia mínima | Chat libre multi-turno |
| Notificación sólo con contenido validado (`policy_ref`) | Multicanal (sólo `PUSH` visto en el contrato) |
| Traza de cada decisión (decision log sin PII) | Dashboard de métricas (se mide desde el log) |

## Qué queda determinístico, asistido o humano 💡 (D-03 abierta)
| Paso | Clasificación propuesta | Por qué |
|---|---|---|
| Recuperar datos y validar frescura/fuente | Determinístico | Reglas explícitas, auditables, sin costo de modelo |
| Evaluar política y filtrar opciones | Determinístico | Es donde el error cuesta dinero o reclamos |
| Redactar el mensaje al pasajero | Plantilla determinística (IA opcional sobre plantilla validada) | La IA no puede introducir hechos; el 422 de `notify_passenger` es la red |
| Interpretar una consulta libre ("quiero compensación") | Candidato a IA-assisted | Sólo extrae intención; no decide entitlement |
| Aprobar `R4`/`R5`, conflictos, 503 sin reconciliar | Humano | Lo exige la política o el riesgo |

## Usuarios y canal
- **Primario:** pasajero (app/web, notificación `PUSH`).
- **Secundario:** agente de la cola `DISRUPTION_L2`, que recibe el caso con evidencia.

## Track del vertical slice
Pendiente (D-01 / ADR-001). Esta descripción vale para cualquiera de los dos tracks.
