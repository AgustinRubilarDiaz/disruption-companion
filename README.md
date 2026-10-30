# Disruption Companion — backend (Caso A, track Backend/Integración)

Servicio que recibe una reserva con un vuelo modificado y devuelve **un solo resultado validado**:
el estado real del viaje, lo que la política le otorga al pasajero, la única opción que se le ofrece
y el siguiente paso. Ante datos en conflicto, incompletos o una aprobación pendiente, deriva a una persona.

- Contrato de salida: `DisruptionAssessment` v1.0 — [`Docs/16-contrato-disruption-assessment.md`](Docs/16-contrato-disruption-assessment.md)
- Especificación de comportamiento: [`brain/features/EP-01_evaluacion-disrupcion.feature`](brain/features/EP-01_evaluacion-disrupcion.feature) y [`brain/features/EP-01_pantalla-pasajero.feature`](brain/features/EP-01_pantalla-pasajero.feature)
- Documentación de negocio y producto: [`Docs/README.md`](Docs/README.md)
- Uso de IA y decisiones: [`AI_USAGE.md`](AI_USAGE.md)

## Correrlo en local

Requiere Node 24.

```bash
# 1. Pantalla (React): se compila a web/dist, que el motor sirve en "/"
cd web && npm install && npm test && npm run build

# 2. Motor
cd ../engine && npm install && npm test && npm run build && npm start
```

Abrir **http://localhost:8080**: la pantalla del pasajero, con un selector de reserva.

```bash
curl -i localhost:8080/v1/bookings/ABC123/disruption-assessment
curl localhost:8080/v1/scenarios
curl -X POST localhost:8080/v1/bookings/ABC123/rebooking-requests \
  -H 'content-type: application/json' -d '{"decision_id":"dec_01JB7Q3M8K2V","option_id":"O1"}'
```

Desarrollo de la pantalla con recarga en caliente: `npm start` en `engine/` y `npm run dev` en `web/`
(Vite redirige `/v1` al 8080).

Con Docker, un solo contenedor con la API y la pantalla (el contexto es la raíz del repositorio):
`docker build -t disruption . && docker run -p 8080:8080 disruption`.

### Pruebas
| Paquete | Comando | Qué cubre |
|---|---|---|
| `engine/` | `npm test` (43) | Escenarios de los dos `.feature`, contrato, unitarios, aceptación de la opción, idempotencia, archivos estáticos |
| `web/` | `npm test` (24) | View model, interacción de la pantalla con jsdom (confirmar, vencimiento, errores), campos prohibidos |

Checklist manual (no hay pruebas con navegador real): abrir `/`, recorrer `ABC123`, `DEMOCONF` y `DEMONOEV`;
en `ABC123` pulsar "Aceptar este cambio", confirmar y verificar "pendiente de confirmación"; recargar y
esperar 115 s para ver el botón desactivado.

## API

| Método y ruta | Respuesta |
|---|---|
| `GET /` | La pantalla del pasajero (React). Sin `web/dist` compilado, lista las reservas en JSON |
| `GET /health` | `{ "status": "ok" }` |
| `POST /v1/bookings/{booking_id}/rebooking-requests` | Acepta la opción recomendada. 201 solicitud creada · 200 duplicado (mismo `request_id`) · 202 indeterminado · 400 · 404 · 410 `OPTION_EXPIRED` · 422 `OPTION_NOT_RECOMMENDED`. Detalle en [`Docs/18`](Docs/18-plan-frontend.md) §5 |
| `GET /v1/scenarios` | Reservas de demostración y qué muestra cada una |
| `GET /v1/bookings/{booking_id}/disruption-assessment` | 200 `DisruptionAssessment` · 400 `INVALID_BOOKING_ID` · 404 `BOOKING_NOT_FOUND` · 500 `INTERNAL_ERROR` |

Una falla de un sistema de lectura no produce un 5xx: produce un 200 con `trip_status: UNVERIFIED`,
`next_step: WAIT_FOR_AGENT` y una derivación `READ_FAILURE`.

### Reservas de demostración

| Reserva | Qué muestra | Resultado |
|---|---|---|
| `ABC123` | Caso base del enunciado: retraso de 160 min, fuente degradada, conexión perdida, menor en el grupo | `RELEVANT_CHANGE`, O1 recomendada (R3), R5 derivada en paralelo (`APPROVAL_REQUIRED`, HC-4471) |
| `DEMOCONF` | Dos fuentes sanas se contradicen sobre S1 | `UNVERIFIED`, `WAIT_FOR_AGENT`, `SOURCE_CONFLICT` |
| `DEMONOEV` | No hay eventos operacionales | `UNVERIFIED` (nunca `NO_CHANGE`), `INCOMPLETE_DATA` |

**Reloj simulado.** Los datos del enunciado son del 2026-09-15 y las opciones valen 120 s: con el reloj
real estarían siempre vencidas. Cada escenario usa un reloj fijo y la respuesta lo declara en el
encabezado `X-Simulated-Clock`.

## Cómo decide

```
get_trip_context ─┐
get_operational_events ─► consolidar ─► impacto ─► política ─► opciones ─► control ─► mensaje
get_policy_rules ─┘                                                  ▲
get_eligible_options ────────────────────────────────────────────────┘
                                   └► create_human_case (por cada derivación) ─► notify_passenger
```

1. **Consolidar** (`domain/consolidate.ts`): se descartan las fuentes degradadas y los eventos con más de 30 min. Por tipo gana el más reciente. Si un retraso y un `ON_TIME` sanos coexisten, el segmento queda `UNVERIFIED`. `data_as_of` es el evento usado más antiguo.
2. **Impacto** (`impact.ts`): la llegada estimada (programada + retraso) se compara con la salida del siguiente segmento + MCT (configurable, 0 por defecto).
3. **Política** (`policy.ts`): se evalúan las condiciones de `get_policy_rules` contra hechos calculados. **Cada entitlement respeta su propia bandera `requires_human_approval`** (decisión P-17). Una condición que el motor no entiende queda como regla no soportada y se deriva.
4. **Opciones** (`options.ts`): descarte con motivo cerrado (asientos, diferencia de tarifa, tarifa no reembolsable, política no vigente, baja confianza, vencida). Se ofrece una sola, la de menor costo, la más temprana y de mayor confianza.
5. **Control** (`control.ts`): un único `next_step` y las derivaciones (`APPROVAL_REQUIRED`, `SOURCE_CONFLICT`, `INCOMPLETE_DATA`, `NO_VIABLE_OPTION`, `UNSUPPORTED_RULE`, `READ_FAILURE`).
6. **Mensaje** (`message.ts`): plantilla cerrada con `policy_ref` obligatorio. Los parámetros sólo salen de la evaluación.
7. **Invariantes** (`invariants.ts`): las 10 del contrato se verifican antes de responder.

El dominio son funciones puras: no hacen I/O ni leen el reloj. Las 7 tools están detrás de un puerto
(`ports/tools.ts`), y hoy el adaptador es un mock con los datos del enunciado. Para conectar los
sistemas reales se cambia sólo el adaptador.

## Estructura

```
engine/
  src/domain/      reglas puras (un archivo por paso)
  src/ports/       interfaz de las 7 tools y del reloj
  src/adapters/    mocks con los fixtures del enunciado (escrituras idempotentes por decision_id)
  src/app/         orquestador (lecturas → evaluación → escrituras) y rebooking (HU-007)
  src/http/        servidor HTTP (node:http, sin framework): API y archivos de la pantalla
  fixtures/        copia de brain/contracts/fixtures (un test verifica que sean idénticos)
  test/            scenarios/ (.feature), contract/, unit/
web/
  src/viewModel.ts contrato → lo que se muestra (función pura, sin lógica de negocio)
  src/copy.ts      textos por template_id
  src/App.tsx      pantalla: alerta, impacto, siguiente paso, confirmar, cuenta regresiva
  test/            viewModel, interacción (jsdom) y fixtures generados por el motor real
Dockerfile         un contenedor con API y pantalla
```

La pantalla sólo lee `DisruptionAssessment` v1.0: no calcula entitlements, elegibilidad ni conexiones.
No muestra `policy_ref`, `rule_id`, `decision_id` ni `data_quality`, y nunca escribe "confirmado":
la solicitud queda "pendiente de confirmación". Textos y reglas: [`brain/contracts/passenger-experience.md`](brain/contracts/passenger-experience.md).

## Seguridad y datos personales
- La respuesta, el registro de decisiones y los logs no contienen nombres, correos, teléfonos, documentos ni nivel de fidelidad: el grupo se describe con cantidad y un indicador de menor. Un test lo verifica en cada reserva.
- Los logs sólo llevan `decision_id`, un seudónimo de la reserva (`bk_…`), el estado y los motivos de derivación.

## Limitaciones conocidas (recorte por tiempo)
- Sólo 3 reservas de demostración. Opciones vencidas, política reemplazada, regla desconocida y sin opción viable están cubiertas por tests unitarios, pero no tienen reserva de demostración.
- No hay autenticación: el 404 por "reserva de otro titular" del contrato no se ejercita.
- Si `get_policy_rules` falla, el servicio responde 500: sin política no se puede construir un mensaje validado. Es una pregunta abierta en `HALLAZGOS.md`.
- Las escrituras (caso humano, notificación) se deduplican por `decision_id` en el mock, y en la demo el `decision_id` es fijo. En producción hay que definir quién deduplica (H-30, H-31).
- Las horas `_local` se comparan sin zona horaria, tal como las entregan las tools (P-07).
- La pantalla no tiene pruebas con navegador real; la interacción se prueba con jsdom. No tiene autenticación, sólo español, y el canal de contacto es genérico (H-32).
- La vigencia de la opción corre desde que carga la pantalla porque el reloj de la demo es fijo (H-33).
- El estado de las solicitudes de cambio vive en memoria: se pierde al reiniciar el servicio.
- La imagen de Docker no se construyó en esta máquina; el `Dockerfile` está sin probar.
