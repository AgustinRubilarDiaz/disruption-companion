# 1. Definición del negocio

## 1.1 Dolor principal
> **Ante una modificación de vuelo, el pasajero no tiene una respuesta única, confiable y
> personalizada a cuatro preguntas: qué pasó, si le afecta, qué le corresponde y qué tiene que hacer.**
> La información existe, pero está repartida en varios sistemas, puede ser contradictoria o parcial,
> y combinarla con la política vigente hoy requiere a una persona.

Ese dolor tiene tres costos, todos visibles en el enunciado:

| Costo | Qué ocurre | Evidencia en el enunciado |
|---|---|---|
| **Costo de atención** | El pasajero llama para que alguien le junte la información | El objetivo de negocio pide reducir "contactos evitables al call center" |
| **Costo del error** | Una recomendación incorrecta genera costo, reclamo o incumplimiento de política | Restricciones del enunciado; acciones de alto impacto |
| **Costo para el pasajero** | La incertidumbre y la demora pueden hacerle perder la mejor alternativa | Opciones con vigencia de 120 s; O2 con 1 asiento; conexión que sale a las 19:05 |

El problema **no es la falta de datos**, sino que **nadie los integra por el pasajero con seguridad**:
- `OPS_CORE` y `LEGACY_MIRROR` se contradicen sobre el mismo vuelo.
- El contexto del viaje llega `PARTIAL`.
- Las opciones son candidatas, no decisiones.
- La política tiene versiones.

## 1.2 Por qué urge resolverlo ahora (Supuesto, P-18)
El enunciado no explica la urgencia. Estos son los argumentos que se pueden sostener con los datos y
que habría que validar con el PM:

1. **El valor de la respuesta se pierde minuto a minuto.** Las opciones vencen a los 120 s, los
   asientos son pocos y la conexión tiene una hora fija. Una respuesta que llega tarde vale poco.
2. **La demanda llega en picos.** Una disrupción afecta a muchos pasajeros a la vez, y la capacidad
   del call center es más escasa justo cuando más se la necesita. El autoservicio escala con la
   demanda; la atención humana no.
3. **El costo de habilitarlo es bajo.** Las interfaces de lectura y escritura y el canal `PUSH` ya
   existen; falta la capa que las combina con criterio.
4. **El riesgo de no hacerlo crece.** Mientras la integración la haga cada agente a mano, la
   aplicación de la política depende de cada persona y no queda traza de por qué se ofreció algo.

## 1.3 Objetivo de negocio (enunciado)
Reducir la incertidumbre del pasajero y los contactos evitables al call center, **manteniendo
exactitud, seguridad y trazabilidad**.

## 1.4 Objetivos estratégicos que apoya (Supuesto, P-18 y P-19)

| ID | Objetivo estratégico | Cómo lo apoya el producto | Tipo de impacto | Se mide con |
|---|---|---|---|---|
| OE-1 | **Reducir el costo de atención** | El pasajero resuelve sin llamar; el call center atiende lo complejo | Financiero | OV-1 (documento 5) |
| OE-2 | **Reducir el costo del error y proteger el margen** | Se otorga lo que dice la política, ni más (fuga de costo) ni menos (reclamo o incumplimiento) | Financiero y de cumplimiento | OV-2 |
| OE-3 | **Hacer más eficiente la operación humana** | Los casos llegan a `DISRUPTION_L2` con evidencia: no hay que reinvestigar | Operativo | Indicador IA-4 |
| OE-4 | **Sostener la confianza del pasajero en la disrupción** | Información verificada, rápida y con un siguiente paso | Experiencia | Indicadores IA-2 e IA-3 |

OE-1 es la razón económica del producto, y OE-2 es su condición: si un error cuesta más de lo que
ahorra cada contacto evitado, automatizar no conviene (ver el punto de equilibrio en el documento 10).

## 1.5 Actores
| Actor | Rol | Interés |
|---|---|---|
| Pasajero | Consulta su viaje y decide su siguiente paso | Saber qué pasó y qué le corresponde, rápido y sin llamar |
| Operación humana (cola `DISRUPTION_L2`) | Resuelve lo que el sistema no debe decidir solo | Recibir casos con evidencia completa, sin volver a preguntar |
| Call center | Canal que hoy absorbe la incertidumbre | Menos contactos evitables, más tiempo para los complejos |
| Dueño de las políticas | Define entitlements versionados | Que se aplique la política vigente, ni más ni menos |
| Equipo de producto (PM, Designer, Team Lead, Engineer) | Construye y opera la V1 | Una solución que pueda operar un equipo pequeño |

## 1.6 Capacidades que pide la V1
- **C1.** Consultar el contexto de su viaje.
- **C2.** Entender si hubo una modificación relevante y qué implica.
- **C3.** Recibir una explicación o recomendación accionable.
- **C4.** Ser derivado a una persona, o iniciar una acción controlada, cuando corresponda.

## 1.7 Restricciones
Resumen: datos que pueden estar desactualizados o ser contradictorios, acciones de alto impacto,
datos personales y mínimo privilegio, equipo pequeño, y latencia, costo y dependencia de modelos.
El detalle y la clasificación están en el documento 11.

## 1.8 Fuera de alcance (Supuesto)
- Decidir compensaciones en dinero sin una persona: la propia política exige aprobación (`POL-DELAY-2026-03/R4`).
- Reemplazar al call center: el producto **deriva** con evidencia, no lo sustituye.
- Escenarios sin política disponible: el enunciado sólo entrega la política de `DELAY`.

## 1.9 Ambigüedades que condicionan el negocio
Qué es una modificación relevante (P-01), qué se muestra al pasajero (P-02), cuándo una
recomendación es automática (P-03), cuándo interviene una persona (P-04) y qué hacer con fuentes
contradictorias (P-05). Ver documento 9.
