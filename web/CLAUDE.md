# passenger-web — CLAUDE.md (nivel 3)

> Sólo lo propio de este componente. Lo transversal vive en `../brain/` — leé `../brain/CLAUDE.md` primero.

## Responsabilidad
Pantalla del pasajero (HU-010, UX-01): muestra qué pasó, qué le implica, su siguiente paso y la hora
de los datos, y le permite aceptar la opción recomendada (HU-007). Consume `DisruptionAssessment` v1.0
tal cual; el motor la sirve compilada desde `dist/` (ADR-010).

## Qué NO hace
- No calcula entitlements, elegibilidad, conexiones ni retrasos: los lee del contrato.
- No muestra `policy_ref`, `rule_id`, `decision_id`, `confidence` ni `data_quality` como texto (ADR-007).
- No dice "confirmado": una solicitud aceptada queda "pendiente de confirmación".
- No deduce nada ante un valor de enum desconocido: muestra el estado genérico y el contacto.
- No tiene backend propio ni llama a las tools.

## Stack (verificado en `package.json` el 2026-10-30)
| Tecnología | Versión |
|---|---|
| Node | ≥ 24 (`engines`) |
| React / React DOM | 19.3.1 |
| Vite | 8.3.5 |
| Tailwind CSS | 4.3.3 |
| TypeScript | 5.9.3 |
| vitest + Testing Library + jsdom | 5.0.5 · 16.3.3 · 30.1.3 |
| Playwright | 1.64.1 (sólo Google Chrome, H-35) |

## Comandos
| Acción | Comando |
|---|---|
| Instalar | `npm ci` |
| Tests (componentes y view model) | `npm test` |
| Tests con navegador real | `npm run test:e2e` (compila la pantalla y el motor y los levanta en el 8091) |
| Compilar | `npm run build` → `dist/` |
| Ejecutar en desarrollo | `npm run dev` (proxy de `/v1` al motor en el 8080) |

## Estructura
| Archivo | Rol |
|---|---|
| `src/types.ts` | Copia de tipos del contrato; no agrega campos |
| `src/api.ts` | Único punto que habla HTTP; traduce 200/201/202/410/422 a resultados |
| `src/viewModel.ts` | Contrato → lo que se pinta (formato, orden). Sin reglas de negocio |
| `src/copy.ts` | Textos por `template_id` y estado |
| `src/App.tsx`, `src/components/` | Presentación |

## Reglas críticas
✅ BIEN: el botón "Aceptar opción" existe sólo si `next_step = ACCEPT_OPTION` y pide confirmación.
❌ MAL: habilitarlo porque hay una opción en pantalla, o después de `valid_until`.

✅ BIEN: con `trip_status = UNVERIFIED`, "no pudimos confirmar el estado de tu viaje".
❌ MAL: mostrar "sin cambios" porque no llegaron eventos.

## Contratos
- Consume: `../brain/contracts/disruption-assessment.md` y `../brain/contracts/disruption-api.md`.
- Especificación de la experiencia: `../brain/contracts/passenger-experience.md`.

## Checklist antes de cerrar una HU
- [ ] `.feature` de la HU (`../brain/features/EP-01_pantalla-pasajero.feature`, `UX-01_pantalla-moderna.feature`) en verde con `npm test` y `npm run test:e2e`
- [ ] Si cambió el contrato, los fixtures de `test/fixtures/` se regeneran desde la respuesta del motor
- [ ] Gate `e2e-closure` momento 1
