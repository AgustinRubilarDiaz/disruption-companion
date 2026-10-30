# Triage — diagnóstico de errores

> El diagnóstico empieza por el **código de error de la tool** o la excepción, no por el síntoma.
> Se completa a medida que aparezcan casos reales.

## Errores conocidos de las tools

| Tool | Error | Qué significa | Qué NO hacer | Regla |
|---|---|---|---|---|
| `create_rebooking_request` | 409 `DUPLICATE_REQUEST` | Ya existe una solicitud con esa key (`request_id` en la respuesta) | Tratarlo como fallo o crear otra con key nueva | RN-03 |
| `create_rebooking_request` | 503 `UPSTREAM_TIMEOUT` | Indeterminado: pudo haberse creado | Asumir fracaso y reintentar con otra key; asumir éxito | RN-03 |
| `notify_passenger` | 422 `UNVALIDATED_CONTENT` | El mensaje no trae `policy_ref` | Reintentar el mismo mensaje; quitar la validación | RN-04 |
| `get_trip_context` | `completeness: PARTIAL` | No es error: faltan campos (`missing_fields`) | Rellenar el campo con un supuesto | RN-05 |
| `get_operational_events` | fuente en `sources_degraded` | No es error: la fuente es menos confiable | Ignorar el dato sin dejar evidencia | RN-05 |

## Antes de abrir una FALLA
- [ ] ¿Es un comportamiento esperado de la tool (tabla de arriba)?
- [ ] ¿Es un caso abierto en `HALLAZGOS.md` (comportamiento todavía no decidido)? Entonces no es bug.
- [ ] ¿Está documentado con `@bug-conocido` en un `.feature`?
