# Producto — Disruption Companion

> Documentación de producto extraída del enunciado (`../../Docs/Disruption_Companion.pdf`).
> **El Brain manda:** estos archivos son la fuente; `../../Docs/` es la copia para el comité y se
> regenera con `../operations/sync-docs.sh` (`--check` avisa si quedó desactualizada).
> Lo que es propuesta se marca **Supuesto** y cita su pregunta `H-XX` de `../../HALLAZGOS.md`.

La numeración es la misma que en `Docs/`, así "documento 13" significa lo mismo en los dos lados.

| # | Fuente en el Brain | Copia en `Docs/` | Responde a |
|---|---|---|---|
| 1 | `01-definicion-negocio.md` | `01-…` | ¿Qué problema de negocio hay, para quién y con qué restricciones? |
| 2 | `02-objetivo-principal.md` | `02-…` | ¿Cuál es el único objetivo que guía las decisiones? |
| 3 | `03-descripcion-producto.md` | `03-…` | ¿Qué es el producto, qué hace la V1 y qué no hace? |
| 4 | `04-atributos-de-valor.md` | `04-…` | ¿Qué cualidades hacen valioso al producto y cómo se protegen? |
| 5 | `05-objetivos-medibles.md` | `05-…` | Los dos objetivos de valor, con árbol de KPI e indicadores adelantados |
| 6 | `06-atributos-funcionales.md` | `06-…` | Capacidades funcionales (FN) y no funcionales (NF) de la V1 |
| 7 | `../contracts/logica-contratos.md` | `07-logica-contratos.md` | Cómo se usa cada tool: precondiciones, validaciones, errores |
| 8 | `08-flujo.md` | `08-…` | Flujo deducido, caso base resuelto y puntos de escalabilidad |
| 9 | `../../HALLAZGOS.md` | `09-supuestos-y-preguntas-abiertas.md` (resumen a mano) | Qué se asumió y qué falta decidir |
| 10 | `10-as-is-to-be-e-impacto.md` | `10-…` | AS-IS, TO-BE e impacto financiero y operativo |
| 11 | `11-reglas-de-negocio-y-restricciones.md` | `11-…` | Reglas dadas (RB → RN), de política y de diseño (RD → estado), y restricciones (RS) |
| 12 | `12-sistemas-y-tecnologia-existente.md` | `12-…` | Sistemas, fuentes, datos, permisos e incógnitas de integración |
| 13 | `13-alcance-presupuesto-y-plazos.md` | `13-…` | MVP / fases, presupuesto, fechas, validadores y corte de la entrega |
| 14 | `14-okr.md` | `14-…` | OKR del primer trimestre |
| 16 | `../contracts/disruption-assessment.md` | `16-contrato-disruption-assessment.md` | Contrato de salida `DisruptionAssessment` v1.0 |
| — | `../backlog/EP-01-*.md` y `HU-0XX-*.md` | `epica/` | Épica, HU y criterios de aceptación |

**Sólo en `Docs/`** (entregables y planes, se editan allá): `15-evolucion-y-recomendaciones.md`,
`17-plan-implementacion.md`, `18-plan-frontend.md`, `19-producto-poc-a-propuesta.md`. El Brain los cita.

## Identificadores
Una sola numeración: las preguntas abiertas son `H-XX` en todos lados (antes `Docs/` usaba `P-XX`
con el mismo número). Las reglas `RB` y `RD` de `11-…` se relacionan con las `RN` de la base de
conocimiento como explica `../KNOWLEDGE_BASE.md`.

## Principio de diseño (de todo el set)
**Las tools de lectura informan; la lógica determinística decide; el humano aprueba lo de alto
impacto.** Ajustado al enunciado, sin capacidades que no pide, y con los puntos de extensión
declarados (nuevos escenarios, nuevas fuentes, nuevos canales) en vez de construidos.
