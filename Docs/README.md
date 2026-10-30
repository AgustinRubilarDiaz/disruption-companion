# Disruption Companion — Documentación base

Documentación inicial del producto, extraída del enunciado del desafío (`Disruption_Companion.pdf`,
Caso A). Es la base sobre la que se construyen el vertical slice, el README de ingeniería y la nota
de uso de IA.

| # | Documento | Responde a |
|---|---|---|
| 0 | [00-proceso-documentacion.md](00-proceso-documentacion.md) | ¿Cómo se generaron los documentos 01 a 14? Incluye el análisis previo en NotebookLM |
| 0 | [00-prompts-documentos-entrada.md](00-prompts-documentos-entrada.md) | Los prompts reales usados para esos documentos |
| 1 | [01-definicion-negocio.md](01-definicion-negocio.md) | ¿Qué problema de negocio hay, para quién y con qué restricciones? |
| 2 | [02-objetivo-principal.md](02-objetivo-principal.md) | ¿Cuál es el objetivo que guía las decisiones? |
| 3 | [03-descripcion-producto.md](03-descripcion-producto.md) | ¿Qué es el producto, qué hace la V1 y qué no hace? |
| 4 | [04-atributos-de-valor.md](04-atributos-de-valor.md) | ¿Qué cualidades hacen valioso al producto y cómo se protegen? |
| 5 | [05-objetivos-medibles.md](05-objetivos-medibles.md) | Los dos objetivos de valor que se miden |
| 6 | [06-atributos-funcionales.md](06-atributos-funcionales.md) | Capacidades funcionales y no funcionales de la V1 |
| 7 | [07-logica-contratos.md](07-logica-contratos.md) | Cómo se consume cada sistema disponible: validaciones, errores, idempotencia |
| 8 | [08-flujo.md](08-flujo.md) | Flujo del producto, caso base resuelto y escalabilidad |
| 9 | [09-supuestos-y-preguntas-abiertas.md](09-supuestos-y-preguntas-abiertas.md) | Qué se asumió y qué falta decidir |
| 10 | [10-as-is-to-be-e-impacto.md](10-as-is-to-be-e-impacto.md) | Cómo es hoy, cómo debería funcionar mañana y qué impacto financiero y operativo se busca |
| 11 | [11-reglas-de-negocio-y-restricciones.md](11-reglas-de-negocio-y-restricciones.md) | Todas las reglas (dadas, de política y de diseño) y restricciones, clasificadas |
| 12 | [12-sistemas-y-tecnologia-existente.md](12-sistemas-y-tecnologia-existente.md) | Inventario de sistemas, fuentes, datos, permisos e incógnitas de integración |
| 13 | [13-alcance-presupuesto-y-plazos.md](13-alcance-presupuesto-y-plazos.md) | MVP frente a fases siguientes, presupuesto, fechas tope, validadores y corte de la entrega |
| 14 | [14-okr.md](14-okr.md) | Objetivos y resultados clave del primer trimestre, vinculados a indicadores e iniciativas |
| 15 | [15-evolucion-y-recomendaciones.md](15-evolucion-y-recomendaciones.md) | Evolución posterior al desafío, a partir de la evaluación de la industria |
| 16 | [16-contrato-disruption-assessment.md](16-contrato-disruption-assessment.md) | Contrato de salida del backend v1.0, con el JSON del caso `ABC123` |
| 17 | [17-plan-implementacion.md](17-plan-implementacion.md) | Plan del vertical slice: modelo de datos, algoritmos, API, pruebas, entregables y envío |
| 18 | [18-plan-frontend.md](18-plan-frontend.md) | Plan del frontend funcional: pantalla del pasajero (HU-010) y aceptar la opción (HU-007) |
| 19 | [19-producto-poc-a-propuesta.md](19-producto-poc-a-propuesta.md) | El producto de la POC a la propuesta: reglas de evolución, ramas, catálogo UX/PL y plan de UX-01 |
| 20 | [20-consulta-compleja.md](20-consulta-compleja.md) | La consulta ambigua o compleja (§5.2): descomposición, contexto, clasificación y dónde se detiene |
| — | [epica/EP-01-asistencia-ante-modificacion-de-vuelo.md](epica/EP-01-asistencia-ante-modificacion-de-vuelo.md) y `epica/HU-0XX-*.md` | Épica, mapa de ruta y una historia de usuario por archivo, con criterios de aceptación y validación |

## De dónde sale cada documento
Los documentos 1 a 8, 10 a 14, 16 y la carpeta `epica/` son una **copia generada** desde `../brain/`
(`brain/operations/sync-docs.sh`): se corrigen allá y se regeneran, no se editan acá. El documento 9
resume `../HALLAZGOS.md`. Los documentos 00, 15, 17, 18, 19 y 20 sólo existen acá.

## Convención
- Lo que está explícito en el enunciado se presenta como hecho.
- Lo que es una propuesta de diseño se marca **Supuesto** y referencia su pregunta abierta (`H-XX`)
  en el documento 9.

## Principio de diseño
**Los sistemas de lectura informan; la lógica determinística decide; una persona aprueba lo de alto
impacto.** La V1 se ajusta a lo que pide el enunciado y deja declarados (no construidos) los puntos
de extensión: nuevos escenarios, nuevas fuentes y nuevos canales.
