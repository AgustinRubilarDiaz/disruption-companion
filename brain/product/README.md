# Producto — Disruption Companion

> Documentación de producto extraída del enunciado (`../../Docs/Disruption_Companion.pdf`).
> Convención de estado (igual que `KNOWLEDGE_BASE.md`):
> ✅ **Dado** por el enunciado · 🟡 **Decidido** por el usuario · 💡 **Propuesta** a validar
> (no es regla; si depende de una ambigüedad, cita su `H-XX` de `../../HALLAZGOS.md`).

| # | Documento | Responde a |
|---|---|---|
| 1 | `01-definicion-negocio.md` | ¿Qué problema de negocio hay, para quién y con qué restricciones? |
| 2 | `02-objetivo-principal.md` | ¿Cuál es el único objetivo que guía las decisiones? |
| 3 | `03-descripcion-producto.md` | ¿Qué es el producto, qué hace la V1 y qué no hace? |
| 4 | `04-atributos-de-valor.md` | ¿Qué cualidades hacen valioso al producto y cómo se protegen? |
| 5 | `05-objetivos-medibles.md` | Los dos objetivos de valor que se miden, con fórmula y meta |
| 6 | `06-atributos-funcionales.md` | Capacidades funcionales (FN) y no funcionales (NF) de la V1 |
| 7 | `../contracts/logica-contratos.md` | Cómo se usa cada tool: precondiciones, validaciones, errores |
| 8 | `07-flujo.md` | Flujo deducido, caso base resuelto y puntos de escalabilidad |

## Copia limpia
`../../Docs/*.md` replica este set sin referencias internas (las preguntas `H-XX` pasan a `P-XX`,
con la misma numeración, en `Docs/09-supuestos-y-preguntas-abiertas.md`). Si cambia una, se
actualiza la otra.

**Desde la revisión del 2026-10-29 (16:30), `Docs/` es la versión más completa** y manda ante una
diferencia:
- `Docs/01` agrega el dolor principal, la urgencia y los objetivos estratégicos OE-1 a OE-4.
- `Docs/05` agrega el árbol de KPI y los indicadores adelantados IA-1 a IA-4; la meta de OV-2 se
  deriva del punto de equilibrio.
- Sólo existen en `Docs/`:
  - `10-as-is-to-be-e-impacto.md`
  - `11-reglas-de-negocio-y-restricciones.md` (RB, RD y RS)
  - `12-sistemas-y-tecnologia-existente.md`
  - `13-alcance-presupuesto-y-plazos.md` (MVP / fases, modo sombra, corte de la entrega)
  - `14-okr.md` (O1 pasajero, O2 operación; KR de resultado y de límite)

## Principio de diseño (de todo el set)
**Las tools de lectura informan; la lógica determinística decide; el humano aprueba lo de alto
impacto.** Ajustado al enunciado, sin capacidades que no pide, y con los puntos de extensión
declarados (nuevos escenarios, nuevas fuentes, nuevos canales) en vez de construidos.
