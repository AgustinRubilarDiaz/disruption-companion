# ADR-010 · Pantalla del pasajero en React, paquete `web/` servido por el motor

- **Estado:** Aceptado
- **Fecha:** 2026-10-29 (React) · 2026-10-30 (Tailwind y Playwright, UX-01)
- **Decide:** usuario
- **HU relacionada:** HU-010, HU-007 · UX-01

## Contexto
El track es Backend (ADR-001), pero la entrega se ve mejor con una pantalla funcional: ver la
evaluación y aceptar la opción (F1 + F2, `Docs/18`). La pantalla no puede llevar lógica de negocio y
debe desplegarse con la misma `api_url`.

## Opciones consideradas
### A. HTML + TypeScript sin framework
- A favor: sin dependencias, unos 20 min menos.
- En contra: la interacción de aceptar (confirmar, vencer, duplicado, errores) es más difícil de probar.
### B. React 19 + Vite 8 en un paquete aparte
- A favor: pruebas de interacción con Testing Library; base para evolucionar el producto (UX-01…).
- En contra: Vite 8 es reciente y vitest 4.0.8 (el del motor) no lo soporta.

## Decisión
**B.** El usuario eligió React por las pruebas automáticas de la interacción. El conflicto de versiones
se resuelve con `web/` como **paquete separado** con su propio vitest (5.0.5). El motor sirve
`web/dist` en `/` (con protección de path traversal): **un solo contenedor** para API y pantalla.

Para UX-01 se agregan:
- **Tailwind CSS 4.3.3** con `@tailwindcss/vite`, tokens en CSS con `@theme`, sin librería de componentes.
- **Playwright 1.64.1** con el **Google Chrome instalado** (`channel: 'chrome'`). La descarga de
  Chromium falla detrás del proxy corporativo que intercepta TLS, y **no se desactiva la verificación
  de certificados** para esquivarlo.

## Consecuencias
- Positivas: 41 tests de interacción con jsdom y 3 en navegador real; la pantalla sólo lee
  `DisruptionAssessment` v1.0 vía `toViewModel` (función pura).
- Negativas / costos asumidos: dos `package.json` con versiones de vitest distintas; e2e sólo en Chrome (H-35).
- Reversibilidad: alta. El contrato es la frontera; la pantalla se puede reemplazar sin tocar `engine/`.
