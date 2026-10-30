# ADR-009 · Sin IA en runtime: núcleo 100 % determinístico

- **Estado:** Aceptado
- **Fecha:** 2026-10-29
- **Decide:** usuario (DS / Tech Lead)
- **Resuelve:** D-03 (`HALLAZGOS.md`)
- **Numeración:** ADR-003 a ADR-008 quedan reservados para los ADR planificados en la épica EP-01
  (`Docs/epica/EP-01-…md` §6).

## Contexto
El enunciado (§5) no obliga a usar IA en runtime, pero exige explicar **qué beneficio se esperaba y
por qué el riesgo, el costo o la complejidad no lo justifican**. El comité pregunta además cómo se
garantiza que no se emita un mensaje sin `policy_ref` (pregunta 1 de `Docs/Evaluadores/evaluador-comite.md`).

## Beneficios que se esperaban de la IA
| Uso posible | Beneficio esperado |
|---|---|
| Interpretar una consulta en lenguaje libre | Que el pasajero escriba su duda sin elegir entre opciones |
| Redactar el mensaje al pasajero | Un texto más natural y adaptado al caso |
| Resumir la evidencia para L2 | Que el agente entienda el caso más rápido |
| Resolver ambigüedades de datos | Inferir un dato faltante o el estado entre fuentes contradictorias |

## Por qué no se justifica en la V1
| Criterio | Razón |
|---|---|
| **Riesgo** | Una alucinación en el mensaje o en una inferencia de datos es exactamente el error que el producto tiene que evitar. Con el punto de equilibrio del error en torno al 0,57 % (ejemplo de `Docs/10` §10.5), no hay margen para una fuente de error no determinística |
| **Verificabilidad** | La lógica determinística se prueba con los fixtures; un modelo exige evaluaciones estadísticas que no entran en 3 h |
| **Costo y latencia** | Cada llamada suma costo por interacción y latencia, justo en los picos de disrupción |
| **Dependencia** | Si el modelo falla o cambia, cambia el comportamiento del producto |
| **Privacidad** | Evita por diseño que datos personales lleguen a un proveedor externo |
| **Alternativa suficiente** | Un formulario con opciones cerradas cubre la consulta compleja; las plantillas cubren el mensaje; la evidencia estructurada ya es legible para L2 |

## Decisión
**Sin IA en runtime.** Todo el flujo es determinístico, con derivación a una persona. Criterio que
desempató: en este dominio, el costo de un error supera el beneficio de una experiencia más natural,
y existe una alternativa determinística que cubre cada uso.

## Consecuencias
- Positivas: la garantía del 422 es estructural (invariantes 4 y 5 de `Docs/16`); costo por
  interacción casi nulo; no hay exposición de datos personales a modelos; todo es testeable.
- Negativas / costos asumidos: la consulta compleja se resuelve con opciones cerradas, no con texto
  libre (HU-009 se redefine); los mensajes son menos flexibles.
- Reversibilidad: alta. Si en el futuro se agrega IA para interpretar intención, entra **antes** de la
  etapa 1 del flujo, con un catálogo cerrado de intenciones, sin acceso a escrituras ni a datos
  personales y validada en modo sombra.

## Clasificación
| Paso | Clasificación | Razón | Riesgo | Control / fallback |
|---|---|---|---|---|
| Elegir la consulta | determinístico (opciones cerradas) | Sin ambigüedad de interpretación | El pasajero no encuentra su caso | Opción "hablar con una persona" |
| Evaluar el caso | determinístico | Política versionada y testeable | Regla mal mapeada | Tests con fixtures; regla desconocida → humano |
| Redactar el mensaje | determinístico (plantilla) | Sólo hechos de la evaluación | Mensaje rígido | Revisión del texto con Diseño |
| Casos fuera de regla | human | R4, R5, conflictos y fallas | Carga de L2 | Evidencia estructurada |

## Uso de IA en el desarrollo (no en runtime)
Esta decisión no limita el uso de IA para **construir** la solución; ese uso se registra en
`operations/ai-usage-log.md` (Entregable 3).
