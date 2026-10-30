# 1. Definición del negocio

## Problema ✅
Cuando un vuelo sufre una modificación (retraso, cambio de puerta, cancelación), el pasajero no sabe
con certeza **qué pasó, qué le implica ni qué puede hacer**. Esa incertidumbre se traduce en
**contactos al call center** que podrían evitarse si el pasajero recibiera información confiable y
un siguiente paso claro.

El riesgo inverso también es de negocio: **una recomendación incorrecta genera costo, reclamo o
incumplimiento de política**, y cambiar una reserva o compensar son acciones de alto impacto.

## Objetivo de negocio ✅
Reducir la incertidumbre del pasajero y los contactos evitables al call center, **manteniendo
exactitud, seguridad y trazabilidad**.

## Actores
| Actor | Rol | Interés |
|---|---|---|
| Pasajero | Consulta su viaje y decide su siguiente paso | Saber qué pasó y qué le corresponde, rápido y sin llamar |
| Operación humana (cola `DISRUPTION_L2`) | Resuelve lo que el sistema no debe decidir solo | Recibir casos con evidencia completa, sin re-preguntar |
| Call center | Canal que hoy absorbe la incertidumbre | Menos contactos evitables |
| Negocio / dueño de políticas | Define entitlements versionados | Que se aplique la política vigente, ni más ni menos |
| Equipo de producto (PM, Designer, TL, SE) | Construye y opera la V1 | Solución operable por un equipo pequeño |

## Capacidades que el pasajero debe tener en la V1 ✅
1. Consultar el contexto de su viaje.
2. Entender si hubo una modificación relevante y qué implica.
3. Recibir una explicación o recomendación accionable.
4. Ser derivado a una persona, o iniciar una acción controlada, cuando corresponda.

## Restricciones del negocio ✅
- Los datos operacionales pueden estar **desactualizados o ser contradictorios** entre fuentes.
- Cambiar una reserva o emitir una compensación son **acciones de alto impacto**.
- Datos personales protegidos y **mínimo privilegio**.
- La V1 debe poder **operarla un equipo pequeño**.
- Considerar **latencia, costo por interacción y dependencia de modelos**.

## Lo que el negocio NO pide (fuera de alcance) 💡
- Decidir compensaciones en dinero sin persona (la política misma exige aprobación: `POL-DELAY-2026-03/R4`).
- Reemplazar al call center: el producto **deriva** con evidencia, no lo sustituye.
- Gestionar escenarios sin política disponible (sólo `DELAY` tiene política en el enunciado).

## Ambigüedades de negocio que condicionan la definición
H-01 modificación relevante · H-02 qué se muestra · H-03 cuándo es automático · H-04 cuándo
interviene una persona · H-05 fuentes contradictorias. Ver `../../HALLAZGOS.md`.
