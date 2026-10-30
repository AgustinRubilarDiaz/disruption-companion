# Índice de componentes

> Debe coincidir con `system_topology.json` y `component_registry.json`. Total actual: **3**.

| Componente | Ruta | Qué hace | Stack (verificado en build) | Estado |
|---|---|---|---|---|
| Brain | `brain/` | Harness: dominio, contratos, ADRs, backlog, skills | markdown + json | Activo |
| disruption-engine | `engine/` | Evalúa la reserva, orquesta las 7 tools (mock) con control, acepta la opción y sirve la pantalla | Node ≥ 24, TypeScript 5.9.3, vitest 4.0.8 (`engine/package.json`) | Implementado · POC `v0.1.0-poc` |
| passenger-web | `web/` | Pantalla del pasajero: estado, itinerario, siguiente paso, aceptar la opción. Sin lógica de negocio. Especificación: `contracts/passenger-experience.md` | React 19.3.1, Vite 8.3.5, Tailwind 4.3.3, vitest 5.0.5, Playwright 1.64.1 (`web/package.json`) | Implementado · UX-01 en `feature/UX-01` |
