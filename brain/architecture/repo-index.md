# Índice de componentes

> Debe coincidir con `system_topology.json` y `component_registry.json`. Total actual: **3**.

| Componente | Ruta | Qué hace | Stack (verificado en build) | Estado |
|---|---|---|---|---|
| Brain | `brain/` | Harness: dominio, contratos, ADRs, backlog, skills | markdown + json | Activo |
| disruption-engine | `engine/` | Vertical slice: determina qué corresponde al pasajero y orquesta las tools con control | TypeScript + Node — *a verificar en `engine/package.json`* | Planificado |
| passenger-experience | `brain/contracts/passenger-experience.md` | Capa complementaria: mensajes y wireframe | markdown | Diseño |
