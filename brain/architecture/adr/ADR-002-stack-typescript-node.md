# ADR-002 · Stack TypeScript + Node para `disruption-engine`

- **Estado:** Aceptado
- **Fecha:** 2026-10-29
- **Decide:** usuario (Tech Lead)
- **Resuelve:** D-02 (`HALLAZGOS.md`)

## Contexto
ADR-001 fija el track Backend. Hace falta un stack que permita, dentro de 3 h: tipar los
contratos de las tools, mockearlas con los fixtures y ejecutar los `.feature` como tests.

## Opciones consideradas
> **Enmienda 2026-10-29** (decisión 5 de `Docs/17` §1, aprobada con el recorte por tiempo): los
> `.feature` se escriben en Gherkin y se ejecutan como **tests de vitest con el mismo nombre de
> escenario** (`engine/test/scenarios/`). cucumber-js queda como mejora: su configuración con
> TypeScript consumía tiempo que no había. Versiones verificadas en `engine/package.json`:
> Node ≥ 24, TypeScript 5.9.3, vitest 4.0.8.

### A. TypeScript + Node (vitest + cucumber-js)
- A favor: tipos para los contratos de `tools-api.md`; arranque rápido; los `.feature` en español
  corren con cucumber-js; mismo lenguaje que un frontend futuro.
- En contra: más configuración de tooling que Python (tsconfig, runner).
### B. Python (pytest + pytest-bdd + pydantic)
- A favor: el más liviano para lógica + tests.
- En contra: no comparte tipos con un frontend futuro.
### C. Java + Spring Boot (JUnit + Cucumber)
- A favor: stack conocido por el usuario (MOT).
- En contra: más boilerplate para un slice de 3 h.

## Decisión
**A — TypeScript + Node.** Criterio que desempató: contratos tipados y escenarios Gherkin
ejecutables con el menor costo de arranque compatible con un frontend futuro.

## Consecuencias
- Positivas: los tipos de los contratos detectan desvíos de `tools-api.md` en compilación.
- Negativas / costos asumidos: configurar cucumber-js con TypeScript consume parte del presupuesto.
- Reversibilidad: media. La lógica determinística es portable; el tooling no.

## Versiones
Se fijan en `engine/package.json` al crearlo y se registran con `init-component`.
Entorno local observado el 2026-10-29: Node v24.18.0, npm 11.16.0 (no es una versión fijada en el build).

## Pendiente
- Framework HTTP o sólo función invocable: el enunciado acepta "servicio o función invocable".
  Se decide en el plan de la primera HU.
