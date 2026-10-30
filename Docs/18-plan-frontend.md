# 18 · Plan del frontend funcional (HU-010 y HU-007)

- **Estado:** Aprobado e implementado. Cambio respecto de la propuesta inicial: la pantalla usa
  **React** (Vite + React + TypeScript) en lugar de HTML sin framework, por decisión del usuario.
  Va en un paquete aparte, `web/`, y el contenedor sigue siendo uno solo.
- **Alcance:** una pantalla para el pasajero que consume `DisruptionAssessment` v1.0 (documento 16),
  con la acción de aceptar la opción recomendada.
- **Encaje con el track:** ADR-001 eligió Backend/Integración. La pantalla es la "capa complementaria"
  del enunciado (§5.3), no cambia el track. No lleva lógica de negocio: todo lo decide el backend.

---

## 1. Qué significa "funcional"

| Nivel | Qué incluye | Requiere cambios en el backend |
|---|---|---|
| **F1 · Ver** | Elegir una reserva, ver alerta, impacto, siguiente paso y hora de los datos. Estados `UNVERIFIED` y derivaciones. | Sólo servir los archivos estáticos y hacer idempotentes las escrituras (§2) |
| **F2 · Actuar** | Botón "Aceptar opción" con confirmación, cuenta regresiva de vigencia, resultado "solicitado, pendiente de confirmación" | Sí: endpoint nuevo de HU-007 con clave de idempotencia |

Recomendación: **F1 + F2**. Sin F2 la pantalla es una vista del JSON; con F2 se ve el control de la
acción de alto impacto (confirmación, una sola vez, nunca "confirmado").

## 2. Dos hallazgos que condicionan el plan

1. **Cada GET de evaluación hoy escribe.** El orquestador llama a `create_human_case` y
   `notify_passenger` en cada consulta (H-30). Una pantalla que se actualiza crearía un caso y una
   notificación por cada refresco. **Cambio previo:** las escrituras pasan a ser idempotentes por
   `decision_id` (y motivo, en el caso humano). La segunda consulta devuelve el mismo `case_id` sin
   volver a escribir. Esto cierra H-30.
2. **El reloj es simulado.** Las opciones valen 120 s desde `11:02:35Z`, y el reloj del escenario es
   fijo, así que "vencida" nunca ocurriría. **Decisión de diseño:** la pantalla cuenta la vigencia
   *desde que carga*: `valid_until − evaluated_at` (115 s en el caso base). Al llegar a cero desactiva
   el botón y pide actualizar. El texto declara que el reloj es simulado.

## 3. Componente e impacto (plan de impacto)

| Componente | Cambio | Contrato |
|---|---|---|
| `web/` (nuevo) | Pantalla: React 19 + TypeScript, compilada con Vite 8. Paquete propio, porque vitest 4 (motor) no soporta Vite 8 y la pantalla usa vitest 5 | Consume `DisruptionAssessment` v1.0 sin cambios |
| `engine/src/http/server.ts` | Sirve `/` y `/assets/*` desde `web/dist`, sin salir del directorio. `GET /v1/scenarios` se mantiene | — |
| `Dockerfile` (raíz) | Reemplaza al de `engine/`: compila `web/` y `engine/` y sirve ambos desde un contenedor | — |
| `engine/src/http/server.ts` | **F2:** `POST /v1/bookings/{id}/rebooking-requests` | **Contrato nuevo** (§5), documento 16 §16.1 |
| `engine/src/app/rebooking.ts` (nuevo) | **F2:** valida opción, vigencia y entitlement; calcula la clave; llama a `create_rebooking_request` | HU-007 |
| `engine/src/adapters/mock/` | Memoria de escrituras por `decision_id` y de claves de idempotencia (201 la primera vez, 409 después) | `write_tools_responses.json` |
| `brain/contracts/passenger-experience.md` (nuevo) | Wireframe, textos por `template_id` y reglas de qué se muestra | Cierra el "design-only" de la topología |
| `brain/architecture/system_topology.json` | `passenger-experience` pasa a `implemented` y su `path` a `web/` | — |

**ADR:** ninguno nuevo. Se registra en ADR-001 que la capa complementaria se implementó. La clave de
idempotencia de HU-007 queda como decisión de este plan (§5), formalizada después en ADR-006.

**Fuera de alcance:** autenticación, internacionalización (sólo español), accesibilidad más allá de
semántica HTML y contraste, pruebas con navegador real (Playwright), diseño responsive fino.

## 4. Pantalla

### 4.1 Orden (HU-010, AC 2)
```
┌──────────────────────────────────────────────┐
│ Reserva [ABC123 ▾]            reloj simulado │
├──────────────────────────────────────────────┤
│ ⚠ ALERTA   Tu vuelo LA500 sale ahora a las   │
│            17:10 (160 min de retraso)        │
│ IMPACTO    Con este retraso no llegas a tu   │
│            conexión LA2410 (19:05)           │
│ SIGUIENTE  Te ofrecemos LA2412 · 16-09 08:15 │
│ PASO       para 2 pasajeros, sin costo       │
│            [ Aceptar este cambio ] 01:54     │
│ AVISO      Un agente te contactará en 45 min │
│            para la atención prioritaria      │
│ Datos actualizados a las 10:48 UTC           │
└──────────────────────────────────────────────┘
```

### 4.2 Estados que debe resolver
| Caso | Qué muestra |
|---|---|
| `RELEVANT_CHANGE` + `ACCEPT_OPTION` | Alerta, impacto, opción y botón con cuenta regresiva |
| `UNVERIFIED` | "No pudimos confirmar el estado de tu viaje" y el contacto. **Nunca** "sin cambios" |
| `WAIT_FOR_AGENT` | Sin botón. Mensaje con el SLA si hay caso creado |
| Derivación `CREATION_FAILED` | Canal de contacto alternativo, sin mencionar un caso |
| Opción vencida | Botón desactivado y "Actualizar" |
| `template_id` o enum desconocido | Texto genérico de contacto (documento 16 §16.4). No deduce nada |
| Error 404, 400 o 500 | Mensaje genérico con "reintentar" |

### 4.3 Lo que no se muestra (documento 16 §16.3, RD-02)
`policy_ref`, `rule_id`, `decision_id`, `case_id` (salvo como número de referencia),
`data_quality`, `confidence` y los motivos de descarte. Un test recorre el texto renderizado de todas
las reservas y falla si aparece alguno.

### 4.4 Textos
Una tabla `template_id → texto con {params}` en `web/src/copy.ts`. Es presentación, no regla:
los parámetros salen sólo de `message.params`. Plantillas a cubrir:
`DELAY_MISSED_CONNECTION_REBOOK_V1`, `DELAY_REBOOK_V1`, `DELAY_MISSED_CONNECTION_AGENT_V1`,
`DELAY_CONTACT_V1`, `TRIP_UNVERIFIED_AGENT_V1`, `TRIP_UNVERIFIED_CONTACT_V1`,
`TRIP_INFORMATIVE_CHANGE_V1` y `TRIP_NO_CHANGE_V1`.

## 5. Contrato nuevo (F2): aceptar la opción

`POST /v1/bookings/{booking_id}/rebooking-requests` con `{ "decision_id": "...", "option_id": "O1" }`

| Código | Cuándo | Cuerpo |
|---|---|---|
| 201 | Solicitud creada | `{ request_id, status: "PENDING_CONFIRMATION", expires_at }` |
| 200 | La herramienta respondió 409 (duplicado): se trata como éxito | El mismo cuerpo, con el `request_id` existente |
| 202 | Indeterminado tras reintentar con la misma clave | `{ status: "CONFIRMING" }` y derivación `REBOOKING_INDETERMINATE` |
| 400 | Cuerpo o `booking_id` inválido | `{ error: "INVALID_REQUEST" }` |
| 404 | La reserva no existe | `{ error: "BOOKING_NOT_FOUND" }` |
| 410 | La opción venció | `{ error: "OPTION_EXPIRED" }` |
| 422 | La opción no es la recomendada en la evaluación vigente, o no tiene un entitlement `GRANTED` que la cubra | `{ error: "OPTION_NOT_RECOMMENDED" }` |

**Reglas (HU-007):**
- El backend vuelve a evaluar la reserva y compara. No confía en lo que muestra la pantalla.
- **Clave de idempotencia:** `sha256(booking_id | option_id | policy_ref | passenger_count)`. Es
  determinística: el mismo pedido da la misma clave, y los reintentos por 503 reutilizan la misma.
- El botón sólo existe con `next_step = ACCEPT_OPTION` y pide confirmación antes de enviar.
- El texto de éxito es "solicitado, pendiente de confirmación hasta las HH:MM". **Nunca "confirmado".**
- Con H-17, R5 (atención prioritaria) no impide aceptar la opción: la cubre R3.

## 6. Modelo de datos de la pantalla

La pantalla no define datos propios. Deriva un *view model* puro desde el contrato:

```ts
interface ViewModel {
  kind: 'REBOOK_OFFER' | 'WAIT_FOR_AGENT' | 'UNVERIFIED' | 'INFO' | 'NO_CHANGE' | 'UNKNOWN';
  alert: string;                 // de message.template_id + params
  impact?: string;               // sólo si impact.missed_connection
  option?: { label: string; validForSeconds: number; optionId: string };
  notice?: string;               // derivaciones: SLA o canal alternativo
  dataAsOf?: string;             // el data_as_of más antiguo de los segmentos
  canAccept: boolean;            // next_step === 'ACCEPT_OPTION' && option
}
```

`toViewModel(assessment): ViewModel` es una función pura y es lo que se prueba. React sólo pinta el
resultado. (El tipo implementado en `web/src/viewModel.ts` separa `alert`, `impact`, `next`, `notice`,
`reference` y `option` con su `confirmText`; es la misma idea con los textos ya resueltos.)

## 7. Pruebas

| Nivel | Qué verifica | Dónde |
|---|---|---|
| Unitarias de la pantalla | `toViewModel` para cada estado de §4.2; plantilla desconocida → genérico; formato de la cuenta regresiva | `web/test/viewModel.test.ts` |
| Interacción (jsdom + Testing Library) | Orden alerta → impacto → siguiente paso; botón y cuenta regresiva; confirmar antes de enviar; 201, duplicado, 202, 410, 422 y error de red; vencimiento; campos prohibidos en las 3 reservas | `web/test/app.test.tsx` |
| Backend (HU-007, HU-008) | Clave determinística; opción distinta de la recomendada → 422; vencida → 410; duplicado → 200; 503 → misma clave y 202; refrescar no repite escrituras; archivos estáticos sin salir del directorio | `engine/test/scenarios/EP-01_pantalla-pasajero.test.ts` |
| Sincronía | Los fixtures de `web/test/fixtures` son idénticos a lo que devuelve la API | `engine/test/contract/contract.test.ts` |
| Manual (checklist) | Abrir `http://localhost:8080`, recorrer las 3 reservas, aceptar, esperar el vencimiento | README |

## 8. Escenarios a escribir (gate)

`brain/features/EP-01_pantalla-pasajero.feature`, con las etiquetas `@HU-010` y `@HU-007`:
1. Caso base: la pantalla muestra alerta, impacto, opción y botón, en ese orden.
2. `DEMOCONF`: muestra "no pudimos confirmar", sin botón y sin afirmar el retraso.
3. `DEMONOEV`: nunca muestra "sin cambios".
4. La pantalla no muestra `policy_ref`, `decision_id` ni `data_quality`.
5. Aceptar pide confirmación; sin confirmar no se llama al backend.
6. Aceptar dos veces crea una sola solicitud y ambas respuestas muestran el mismo `request_id`.
7. La opción vence mientras la pantalla está abierta: el botón se desactiva y pide actualizar.
8. Pedir una opción que no es la recomendada se rechaza con 422.
9. Refrescar la pantalla no crea un segundo caso humano ni una segunda notificación.

## 9. Orden y estimación

| # | Paso | Min | Gate |
|---|---|---|---|
| 1 | `.feature` de la pantalla | 8 | **Aprobación del usuario** |
| 2 | Escrituras idempotentes por `decision_id` + test | 8 | |
| 3 | `passenger-experience.md`: wireframe y textos | 8 | |
| 4 | `viewmodel.ts` + `copy.ts` + unitarias | 15 | |
| 5 | HTML, CSS y glue del DOM; el servidor sirve `/` | 15 | Revisión visual en `localhost:8080` |
| 6 | **F2:** `rebooking.ts`, endpoint, mock con 201/409 y tests | 20 | |
| 7 | Escenarios, `forbidden.test.ts`, checklist manual | 10 | |
| 8 | Actualizar README, topología, HALLAZGOS | 6 | |
| | **Total** | **≈ 90** | F1 sola: ≈ 55 |

**Si no alcanza el tiempo, se recorta en este orden:**
1. El 503 indeterminado de F2 (queda como test unitario, sin reserva de demostración).
2. La cuenta regresiva (queda el botón sin vencimiento visible, declarado como limitación).
3. F2 completo: la pantalla queda en F1, con el botón mostrado pero deshabilitado y declarado.

**No se recorta:** la idempotencia de las escrituras (paso 2), los textos que no afirman lo que el
backend no sostiene, y la prueba de campos prohibidos.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| La pantalla deduce o recalcula negocio | `toViewModel` sólo lee el contrato; un test lo cubre con una evaluación alterada |
| El texto afirma algo que la evaluación no sostiene | Los parámetros sólo salen de `message.params`; plantilla desconocida → genérico |
| Los refrescos duplican casos y avisos | Paso 2, antes de cualquier pantalla |
| "Confirmado" en vez de "pendiente" | Un test busca la palabra en los textos de éxito |
| El reloj simulado confunde en la demo | Se declara en la pantalla y en el README |
| Despliegue en GCP | Misma imagen: la pantalla va en el contenedor, sin CORS ni segundo servicio |

## 11. Decisiones a aprobar

1. **Alcance:** F1 + F2 (recomendado) o sólo F1.
2. **Tecnología:** ~~HTML + TypeScript sin framework~~ → **React** (decidido por el usuario), servido
   por el mismo servicio y el mismo contenedor.
3. **Vigencia en la demo:** cuenta regresiva desde la carga, con el reloj simulado declarado.
4. **Idempotencia de escrituras por `decision_id`** como cambio previo (cierra H-30).
5. **Clave de idempotencia** de §5.
