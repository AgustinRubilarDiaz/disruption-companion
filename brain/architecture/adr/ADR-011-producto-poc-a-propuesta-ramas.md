# ADR-011 · Producto: de la POC a la propuesta, con ramas y versiones

- **Estado:** Aceptado
- **Fecha:** 2026-10-30
- **Decide:** usuario
- **HU relacionada:** UX-01 (primera evolución)

## Contexto
La POC cubre el desafío completo. El usuario quiere tratar Disruption Companion como producto: un
backend y una pantalla que evolucionan con criterio libre hacia la propuesta (`Docs/15`, `Docs/19`),
sin romper lo que la entrega del desafío ya cubre.

## Opciones consideradas
### A. Seguir trabajando sobre una sola rama
- A favor: simple.
- En contra: una evolución a medio camino podría llegar a la `api_url` que revisa el comité.
### B. `main` productiva, `dev` de integración, `feature/<ID>` por evolución
- A favor: la POC queda congelada y desplegable; cada evolución se integra y se libera con aprobación.
- En contra: un paso de merge más.

## Decisión
**B.**
- `main` = productiva. Hoy contiene la POC, con el tag **`v0.1.0-poc`** (commit `b204ab7`). El envío
  del desafío (`github_url`, `api_url`) apunta a `main`, y `main` no recibe evoluciones hasta que el envío esté hecho.
- `dev` = integración. Cada evolución va en `feature/<ID>` desde `dev` y vuelve a `dev` por merge aprobado.
- Release = merge aprobado de `dev` a `main` + tag semántico (`v0.2.0`, …).
- **El contrato es la frontera:** una evolución que sólo usa `DisruptionAssessment` v1.0 es libre; si
  necesita datos nuevos, primero sube la versión menor del contrato.
- **Lo que la POC garantiza sigue garantizado:** sus `.feature` y tests pasan en cada evolución.
- Remote: `origin` = `github.com/AgustinRubilarDiaz/disruption-companion` (público). La identidad de
  git es local al repo; el push lo hace el usuario.

## Enmienda 2026-10-30 — release antes del envío
UX-01 cuenta dentro de las 3 h declaradas, como mejora menor, y los entregables corregidos
(README, `EVIDENCIA.md`, `AI_USAGE.md`) tienen que estar en `main`. Por eso, **antes del envío** se
libera `dev` → `main` como **`v0.2.0`**, y el envío (`github_url`, `api_url`) apunta a esa versión.
`v0.1.0-poc` queda como referencia de la POC sin la mejora. Después del envío vuelve a regir la
regla original: `main` no recibe evoluciones hasta una release aprobada.

## Consecuencias
- Positivas: el comité ve una versión estable; las evoluciones (catálogo UX-01…05, PL-01…04 de
  `Docs/19`) tienen métrica y no se mezclan con la entrega.
- Negativas / costos asumidos: hay que proteger `main` en GitHub (pendiente del usuario).
- Reversibilidad: alta.
