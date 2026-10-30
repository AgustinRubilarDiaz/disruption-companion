# Experiencia del pasajero — pantalla (HU-010) y aceptación (HU-007)

> Componente `passenger-experience` (ADR-001, capa complementaria). Implementado en `web/`.
> Consume `DisruptionAssessment` v1.0 ([`disruption-api.md`](disruption-api.md), [`disruption-assessment.md`](disruption-assessment.md)) y no
> lleva lógica de negocio: no calcula entitlements, elegibilidad ni conexiones.

## Orden de la pantalla
1. **Alerta** — qué pasó.
2. **Impacto** — qué le implica (sólo si la plantilla lo trae).
3. **Siguiente paso** — la opción y el botón "Aceptar este cambio", o el aviso de contacto.
4. **Aviso** — derivaciones en paralelo (por ejemplo, la atención prioritaria de R5).
5. Pie: número de referencia, hora de los datos (el `data_as_of` más antiguo) y "Actualizar".

## Textos por `template_id`
Los parámetros salen sólo de `message.params` (y de `impact.connection` para la hora de la conexión).
Fuente: `web/src/copy.ts`.

| `template_id` | Alerta | Impacto | Siguiente paso |
|---|---|---|---|
| `DELAY_MISSED_CONNECTION_REBOOK_V1` | Tu vuelo {delayed_flight} sale ahora a las {new_departure_local}. | Con este retraso no llegas a tu conexión {missed_flight} de las {hora}. | Te ofrecemos el vuelo {option_flight} del {option_date} a las {option_departure_local} para {n} pasajeros, sin costo adicional. + botón |
| `DELAY_REBOOK_V1` | igual | — | igual + botón |
| `DELAY_MISSED_CONNECTION_AGENT_V1` | Tu vuelo {delayed_flight} tiene un retraso. | igual | Un agente te contactará en {agent_sla_minutes} minutos para ofrecerte alternativas. |
| `DELAY_CONTACT_V1` | Tu vuelo {delayed_flight} tiene un retraso. | — | Contacta a un agente de LATAM: te ayudaremos con tus alternativas. |
| `TRIP_UNVERIFIED_AGENT_V1` | No pudimos confirmar el estado de tu viaje. | — | Un agente te contactará en {agent_sla_minutes} minutos con novedades. |
| `TRIP_UNVERIFIED_CONTACT_V1` | No pudimos confirmar el estado de tu viaje. | — | Contacta a un agente de LATAM… |
| `TRIP_INFORMATIVE_CHANGE_V1` | Hay una actualización en tu vuelo {delayed_flight}. | — | No necesitas hacer nada por ahora. |
| `TRIP_NO_CHANGE_V1` | No hay cambios en tu viaje. | — | No necesitas hacer nada. |
| *(desconocida)* | No pudimos confirmar el estado de tu viaje. | — | Contacta a un agente de LATAM… (nunca habilita el botón) |

"Sin costo adicional" se afirma porque la plantilla de oferta sólo se construye cuando hay una opción
recomendada, y ésta exige el entitlement `REBOOK_NO_FEE` otorgado.
El canal de contacto es genérico a propósito: el enunciado no define ninguno y no se inventa.

## Qué nunca se muestra (RD-02, `disruption-assessment.md` §16.3)
`policy_ref`, `rule_id`, `decision_id`, `data_quality`, `confidence` y los motivos de descarte.
El `case_id` sólo como "N.º de referencia". Un test lo verifica en las tres reservas de demostración.

## Aceptar la opción (HU-007)
- El botón existe sólo si `next_step = ACCEPT_OPTION`, hay `recommended_option` y la plantilla es una oferta conocida.
- Pide confirmación antes de enviar; sin confirmar no se llama al backend.
- Cuenta regresiva `valid_until − evaluated_at` desde que carga la pantalla (115 s en el caso base);
  al llegar a cero el botón se desactiva y se pide actualizar. El reloj de la demo es simulado.
- Respuestas de `POST /v1/bookings/{id}/rebooking-requests`:

| Código | La pantalla muestra |
|---|---|
| 201 | "Solicitud enviada: pendiente de confirmación hasta las HH:MM UTC" + n.º de la solicitud |
| 200 (duplicado) | Lo mismo, con el `request_id` existente |
| 202 | "Estamos confirmando tu solicitud." (nunca éxito) |
| 410 | "La opción venció. Actualiza…" |
| 422 | "Esta opción ya no está disponible. Actualiza…" |
| otro / red | "No pudimos enviar tu solicitud. Intenta de nuevo." |

Nunca se escribe "confirmado": la solicitud queda pendiente hasta que el sistema de reservas la confirme.

## Clave de idempotencia (decisión de Docs/18 §5)
`sha256(booking_id | option_id | policy_ref | passenger_count)`, calculada por el backend. Los
reintentos por 503 reutilizan la misma clave. La formaliza ADR-006.

## Fuera de alcance
Autenticación, otros idiomas, accesibilidad más allá de HTML semántico y roles ARIA, pruebas con un
navegador real y diseño responsive fino.
