# 00 · Cómo se construyó la documentación

Pasos con los que se generaron los documentos de entrada `Docs/01` a `Docs/14`, desde el enunciado
hasta la base sobre la que se escribió el código. Los prompts usados en cada paso están en
[`00-prompts-documentos-entrada.md`](00-prompts-documentos-entrada.md).

## Paso 0 · Análisis limpio y cerrado del enunciado (NotebookLM)

Antes de trabajar con el agente de código, el PDF del desafío (`Disruption_Companion.pdf`) se cargó
en un cuaderno de NotebookLM:
[cuaderno Disruption Companion](https://notebooklm.google.com/notebook/7d959f64-6aa0-42ea-b2b7-e58594bd9195).

- **Por qué:** el cuaderno responde sólo con el enunciado como fuente. Es un análisis **limpio**
  (sin el contexto ni las suposiciones de otras conversaciones) y **cerrado** (no agrega
  conocimiento externo sobre aerolíneas que el enunciado no dé).
- **Para qué:** generar **puntos de entrada limpios** para crear el harness (el Brain, `brain/`):
  objetivo, restricciones, contratos de las tools, ambigüedades y entregables, sin interpretación
  previa.

## Paso 1 · Bootstrap del harness (Brain)

Con esos puntos de entrada se creó `brain/`: reglas de trabajo, skills por fase, dominio, contratos
de las tools y los fixtures del enunciado (`brain/enhancements/ENH-001-bootstrap.md`). Es
preparación del entorno de trabajo: se declara aparte de las 3 h efectivas (`AI_USAGE.md`).

## Paso 2 · Documentos 01 a 08: producto, contratos y flujo

Un prompt pidió estudiar el requerimiento y separar en archivos el objetivo principal, los atributos
de valor, la descripción del producto, la definición del negocio, dos objetivos medibles, los
atributos funcionales, la lógica de los contratos y un flujo, sin complejizar.

| Documento | Contenido |
|---|---|
| `01-definicion-negocio.md` | Problema de negocio, para quién y con qué restricciones |
| `02-objetivo-principal.md` | El objetivo que guía las decisiones |
| `03-descripcion-producto.md` | Qué hace la V1 y qué no |
| `04-atributos-de-valor.md` | Cualidades que hacen valioso al producto |
| `05-objetivos-medibles.md` | Los dos objetivos de valor medibles (OV-1, OV-2) |
| `06-atributos-funcionales.md` | Capacidades funcionales y no funcionales |
| `07-logica-contratos.md` | Cómo se consume cada tool: validaciones, errores, idempotencia |
| `08-flujo.md` | Flujo en 7 etapas y el caso base `ABC123` resuelto a mano |

Lo que el enunciado no define quedó como pregunta abierta en `HALLAZGOS.md`, no como regla.

## Paso 3 · Copia limpia en `Docs/` y documento 09

Un segundo prompt pidió dejar una copia limpia y autocontenida en `Docs/`, sin referencias internas
del Brain. El documento `09-supuestos-y-preguntas-abiertas.md` resume `HALLAZGOS.md`.

## Paso 4 · Profundidad de negocio: documentos 10 a 12

Se repasó la documentación contra una lista de verificación: dolor principal, objetivos
estratégicos, KPIs, AS-IS (escaso en el enunciado) y TO-BE con su impacto financiero y operativo.

| Documento | Contenido |
|---|---|
| `10-as-is-to-be-e-impacto.md` | Hoy, mañana y el impacto buscado; punto de equilibrio del error |
| `11-reglas-de-negocio-y-restricciones.md` | Reglas dadas, de política y de diseño, clasificadas |
| `12-sistemas-y-tecnologia-existente.md` | Inventario de sistemas, datos, permisos e incógnitas |

En este paso se corrigieron `01` y `05`: el análisis de equilibrio mostró que una meta de error del
1 % daba un beneficio neto negativo.

## Paso 5 · Alcance, presupuesto y plazos: documento 13

`13-alcance-presupuesto-y-plazos.md`: MVP frente a fases siguientes, fechas tope, quién valida y el
corte de la entrega dentro de las 3 h.

## Paso 6 · OKR: documento 14

`14-okr.md`: objetivos y resultados clave del primer trimestre, vinculados a los indicadores de
`05` y a las iniciativas.

## Después del documento 14
- La épica y las historias de usuario (`epica/`, hoy generadas desde `brain/backlog/`).
- `15`: evolución posterior, a partir de dos evaluaciones simuladas (`Docs/Evaluadores/`).
- `16` a `19`: contrato de salida y planes de implementación, pantalla y producto.

## Cómo se controló lo que generó la IA
- Cada documento se revisó contra el PDF.
- Lo que no está en el enunciado se marca **Supuesto** y cita su pregunta abierta (`H-XX`).
- Las metas sin línea base (OV-1, OV-2) se declaran hipótesis (H-16).
- Hoy los documentos 01 a 08 y 10 a 14 se generan desde `brain/` y no se editan acá (`Docs/README.md`).
