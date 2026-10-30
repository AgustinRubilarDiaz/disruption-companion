# HU-010 · Ver en pantalla el estado, la alerta y la recomendación (capa complementaria)

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Media · 15 min (prevista como especificación; se implementó)
- **Capacidad:** §5.3 del enunciado (capa complementaria)

## Historia
Como pasajero, quiero una pantalla que me muestre de un vistazo el estado de mi viaje, la alerta y
qué hacer, para decidir rápido.

## Criterios de aceptación
1. La pantalla consume sólo el contrato de salida (`DisruptionAssessment`); no calcula entitlements,
   elegibilidad ni conexiones.
2. Muestra, en este orden: alerta (qué pasó), impacto (qué me implica), siguiente paso (botón o
   mensaje del SLA) y la hora de actualización de los datos.
3. Con `trip_status = UNVERIFIED` no muestra "sin cambios": muestra "no pudimos confirmar el estado" y
   el siguiente paso.
4. El botón "aceptar opción" sólo existe si `next_step = ACCEPT_OPTION`, y pide una confirmación antes
   de enviar.
5. **(neg)** Si la opción venció mientras la pantalla estaba abierta, el botón se desactiva y se pide
   actualizar.

## Reglas de negocio que toca
- RN-04 · RN-06

## Componentes y contratos
- Componentes: `web/` (React; ADR-010) servido por `engine/`
- Contratos: `disruption-api.md` · `passenger-experience.md`

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Mostrar el resultado | determinístico | Plantilla desconocida → texto genérico de contacto |

## Validación
- `.feature`: `features/EP-01_pantalla-pasajero.feature` (escenarios `@HU-010`) · `features/UX-01_pantalla-moderna.feature`
- Tests: `web/test/app.test.tsx`, `web/test/viewModel.test.ts`, `web/test/ux01.test.tsx`, `web/e2e/ux01.spec.ts`, `engine/test/scenarios/EP-01_pantalla-pasajero.test.ts`

| AC | Evidencia |
|---|---|
| 2 | Escenario: caso base, alerta, impacto, opción y botón en ese orden |
| 3 | Escenarios DEMOCONF y DEMONOEV |
| 4 | Escenario: aceptar pide confirmación (HU-007) |
| 5 | Escenario: la opción vence mientras la pantalla está abierta |
| 1 | Por diseño (`viewModel.ts` sólo mapea el contrato); sin test específico |

## Dependencias y riesgos
- La vigencia corre desde que carga la pantalla por el reloj simulado (H-33).
- ADR-001 dejaba la capa del pasajero como diseño; ADR-010 la implementa en `web/`.

## Preguntas abiertas
- H-02 · H-32 · H-33

## Historial
- 2026-10-29 — `b204ab7` implementada en `web/` (estaba prevista como especificación).
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
