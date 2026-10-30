# disruption-engine — CLAUDE.md (nivel 3)

> Sólo lo propio de este componente. Lo transversal vive en `../brain/` — leé `../brain/CLAUDE.md` primero.

## Responsabilidad
Evalúa una reserva con un cambio en su viaje y devuelve un `DisruptionAssessment` v1.0: consolida los
eventos, calcula el impacto, aplica la política vigente, filtra las opciones, decide el siguiente paso,
deriva a una persona y notifica. También acepta la opción recomendada (HU-007) y sirve la pantalla
compilada (`../web/dist`).

## Qué NO hace
- No llama a modelos de IA (ADR-009). Todo es determinístico.
- `domain/` no hace I/O: no llama tools, no lee el reloj ni el entorno. Recibe todo por parámetro.
- No confía en lo que mostró la pantalla: el POST de HU-007 vuelve a evaluar la reserva antes de escribir.
- No expone datos personales en la respuesta, el registro ni los logs (RN-06, invariante 7).
- No inventa reglas: una condición de la política que no entiende se deriva con `UNSUPPORTED_RULE` (ADR-004).

## Stack (verificado en `package.json` el 2026-10-30)
| Tecnología | Versión |
|---|---|
| Node | ≥ 24 (`engines`) |
| TypeScript | 5.9.3 |
| vitest | 4.0.8 |
| tsx | 4.20.6 (sólo desarrollo) |
| Dependencias de runtime | ninguna (sólo `node:http`, `node:crypto`) |

## Comandos
| Acción | Comando |
|---|---|
| Instalar | `npm ci` |
| Tests (unitarios, escenarios BDD y contrato) | `npm test` |
| Tipos | `npm run typecheck` |
| Compilar | `npm run build` |
| Ejecutar | `npm start` (puerto `PORT`, por defecto 8080) · desarrollo: `npm run dev` |

## Estructura
| Capa | Archivos | Regla |
|---|---|---|
| `http/` | `server.ts` | Valida la entrada, traduce resultados a códigos HTTP, sirve `web/dist` sin salir del directorio |
| `app/` | `orchestrator.ts`, `rebooking.ts` | Única capa que llama al puerto `Tools`; orden: lecturas → evaluación pura → escrituras |
| `domain/` | `consolidate` → `impact` → `policy` → `options` → `control` → `message`; `invariants`; `assess` | Funciones puras; un paso por HU (HU-001 a HU-006) |
| `ports/` | `tools.ts` | Las 7 tools del enunciado. El motor sólo conoce este puerto |
| `adapters/mock/` | `mockTools.ts`, `scenarios.ts` | Respuestas exactas de `../brain/contracts/fixtures/`; `MockState` deduplica escrituras por `decision_id` |

Diagrama: `../brain/architecture/diagrams.md` (contenedores y modelo de datos).

## Reglas críticas
✅ BIEN: `checkInvariants` corre antes de `notify_passenger`; si falla, no se notifica y la respuesta es 500.
❌ MAL: armar `message.params` con un valor que no está en la evaluación (invariante 5).

✅ BIEN: ante un 503 de `create_rebooking_request`, reintentar con **la misma** clave (RN-03, ADR-006).
❌ MAL: generar una clave nueva en el reintento, o responder "confirmado".

✅ BIEN: un parámetro de negocio nuevo (umbral, MCT) entra en `EngineConfig` con su `H-XX`.
❌ MAL: un número mágico en `domain/` sin hallazgo ni regla que lo respalde.

## Contratos
- Consume: `../brain/contracts/tools-api.md` (puerto `Tools`; la firma de `get_eligible_options` difiere, ver H-36).
- Produce: `../brain/contracts/disruption-assessment.md` (respuesta) y `../brain/contracts/disruption-api.md` (endpoints).

## Checklist antes de cerrar una HU
- [ ] `.feature` de la HU en `../brain/features/` con su test en `test/scenarios/`, en verde con `npm test`
- [ ] `npm run typecheck` sin errores
- [ ] Si cambió un campo de la respuesta: contrato y fixtures actualizados **antes** del código
- [ ] Gate `e2e-closure` momento 1
