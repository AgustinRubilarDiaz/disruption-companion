# 13. Alcance, presupuesto y plazos

Hay dos niveles que no se deben mezclar:

| Nivel | Qué se prioriza | Presupuesto | Plazo |
|---|---|---|---|
| **Producto** (lo que el negocio quiere) | MVP frente a las fases siguientes | No informado (P-28) | No informado (P-26) |
| **Entrega del desafío** (lo que se construye ahora) | Qué parte del MVP se implementa y qué queda como diseño | **3 h efectivas** | **48 h** desde la recepción del enunciado |

---

## 13.1 Producto: qué es lo mínimo indispensable

### Criterio para que algo entre al MVP
Una capacidad entra al MVP sólo si **sin ella el producto no cumple su objetivo o no es seguro**:
1. **Sin ella, el pasajero igual tiene que llamar**: no hay contención (OV-1).
2. **Sin ella, el producto puede equivocarse o actuar sin control**: no hay exactitud (OV-2).
3. **Sin ella, no se puede medir** si funcionó.

Todo lo demás puede esperar.

### Priorización (MoSCoW)

| Capacidad | HU | Prioridad | Por qué |
|---|---|---|---|
| Estado verificado del viaje (fuente, frescura, conflicto) | HU-001 | **Must** | Sin datos verificados, todo lo demás es inseguro |
| Impacto en el itinerario (conexión perdida) | HU-002 | **Must** | Es lo que el pasajero no puede deducir solo |
| Lo que corresponde según la política vigente | HU-003 | **Must** | Es el núcleo del valor y del riesgo |
| Opción viable para todo el grupo | HU-004 | **Must** | Sin una opción concreta no hay siguiente paso |
| Derivación a una persona con evidencia | HU-005 | **Must** | Es la red de seguridad: sin ella, cada duda se vuelve una respuesta riesgosa |
| Registro de decisiones sin datos personales | HU-008 | **Must** | Sin él no se mide OV-1 ni OV-2 y no hay trazabilidad |
| Notificación validada | HU-006 | **Must** | El pasajero tiene que recibir la respuesta |
| Solicitud de cambio de vuelo controlada | HU-007 | **Must** (ver nota) | Si el pasajero tiene que llamar para ejecutar el cambio, el contacto no se evita |
| Pantalla del pasajero | HU-010 | **Should** | El MVP puede funcionar sólo con notificación; la pantalla mejora la claridad |
| Consulta compleja con opciones cerradas | HU-009 | **Could** | Sin IA en runtime (ADR-009); el flujo base ya cubre la consulta por reserva |
| Aviso proactivo sin que el pasajero consulte | — | **Won't (fase 2)** | Necesita un disparador de eventos que no existe (P-22) |
| Escenarios de cancelación y desvío | — | **Won't (fase 2)** | No hay política ni tipos de evento |
| Reembolso | — | **Won't (fase 2)** | Falta la política `POL-REFUND-2026-01` (P-23) |
| Ejecución de `MEAL_VOUCHER` y alojamiento | — | **Won't (fase 2)** | La política no cubre el alojamiento (P-15); el voucher no tiene un sistema para emitirlo |
| Dashboard de métricas, varios canales y varios idiomas | — | **Won't (fase 2 y 3)** | El registro de decisiones alcanza para medir en el MVP |

**Nota sobre HU-007.** El enunciado pide que el pasajero sea derivado **o** inicie una acción
controlada. En sentido estricto, derivar ya cumple. Pero si el pasajero ve la opción O1 y tiene que
llamar para tomarla, OV-1 no mejora. Por eso la solicitud controlada está en el MVP del producto,
aunque en la entrega del desafío quede como pseudocódigo (§13.3).

### Fases del producto

| Fase | Alcance | Condición para pasar a la siguiente |
|---|---|---|
| **0 · Modo sombra** | El Companion evalúa los casos reales pero no responde al pasajero: un agente compara la recomendación con lo que él decidió | OV-2 medido por debajo de `e_max` (documento 10) sin exponer al pasajero |
| **1 · MVP** | Todo lo **Must**, escenario `DELAY`, parte del tráfico (piloto) | OV-1 mejora frente al grupo de control y OV-2 se mantiene debajo de `e_max` |
| **2 · Ampliación** | Aviso proactivo, cancelación, reembolso, voucher, pantalla completa y consulta con opciones cerradas (HU-009) | Las políticas y los disparadores necesarios existen (P-22, P-23) |
| **3 · Escala** | Varios canales e idiomas, dashboard y personalización si el negocio la define como regla (P-25) | Volumen y economía lo justifican |

**El modo sombra es la recomendación más importante de este documento.** Permite medir la exactitud
con casos reales **antes** de que un error llegue a un pasajero, y convierte la meta de OV-2 en un
dato medido en lugar de una apuesta.

---

## 13.2 Producto: presupuesto y plazos

### Presupuesto
El enunciado no informa presupuesto (P-28). Lo que sí se puede decir sobre los costos:

| Componente de costo | Situación | Cómo se controla |
|---|---|---|
| Equipo | Equipo compacto: PM, Product Designer, Engineering Team Lead y Software Engineer | Diseño simple, sin piezas que exijan especialistas |
| Costo por interacción | Casi nulo con un núcleo determinístico | Sin IA en runtime (ADR-009): no hay costo de modelo |
| Infraestructura | Orquestador sin estado más un registro de decisiones | Escala con el tráfico; sin capacidad reservada |
| Costo del error | El componente más caro y más variable | Modo sombra, derivación conservadora y meta derivada de `e_max` |

### Plazos y fechas tope
El enunciado **no menciona una fecha tope** de ley, temporada ni contrato (P-26). Lo que hay que preguntar:

| Posible fecha tope | Por qué importaría | Origen |
|---|---|---|
| Temporada alta (vacaciones de verano e invierno, fiestas de fin de año) | Más disrupciones y más contactos: es el mejor momento para tener el producto y el peor para lanzarlo | Supuesto (P-26) |
| Cambios regulatorios de derechos del pasajero | Pueden obligar a cambiar lo que corresponde y la forma de informarlo | Supuesto (P-21) |
| Contratos o SLA con el call center | Pueden fijar metas de volumen o costo | Supuesto (P-26) |
| Nueva versión de política | `POL-DELAY-2026-03` reemplazó a una versión anterior; las políticas cambian | Evidencia: los predicados por regla tienen que actualizarse a tiempo |

**Recomendación:** si existe una temporada alta cercana, el modo sombra tiene que terminar **antes**
de ella. Lanzar el MVP en plena temporada maximiza el impacto, pero también el costo de un error.

### Quién valida los avances

| Rol | Qué valida | Artefacto | Disponibilidad |
|---|---|---|---|
| Product Manager | Alcance del MVP, objetivos, KPI y metas | Documentos 1, 2, 5, 13 y la épica | A confirmar (P-27) |
| Product Designer | Qué ve el pasajero y cómo se le dice | RD-02, HU-006 y HU-010 | A confirmar (P-27) |
| Engineering Team Lead | Arquitectura, contratos y ADR | Documentos 7 y 12, ADR-001 a ADR-008 | A confirmar (P-27) |
| Dueño de las políticas | Interpretación de R1 a R5 y reglas de diseño | Documento 11 | No identificado (P-27) |
| Operación L2 | Contenido de la evidencia y motivos de derivación | HU-005 | No identificado (P-27) |
| Legal y privacidad | Datos personales y derechos regulatorios | Documento 12 §12.4, P-21 | No identificado (P-27) |

---

## 13.3 Entrega del desafío: presupuesto de tiempo

### Plazos
| Hito | Fecha | Origen |
|---|---|---|
| Recepción del enunciado | 28-10-2026 15:06 | Supuesto: fecha del archivo PDF |
| **Fecha tope de entrega (48 h)** | **30-10-2026 15:06** | Supuesto, derivado de la recepción; hay que confirmarlo |
| Defensa ante el comité | Dentro de las 48 h hábiles siguientes a la entrega | Enunciado |
| Validadores | El comité de dos evaluadores, en la defensa; hasta entonces, el propio candidato como Domain Specialist | Enunciado |

### Tiempo efectivo
| Concepto | Minutos |
|---|---|
| Presupuesto total | 180 |
| Consumido (estimación de reloj, desde las 15:32 hasta las 16:45 del 29-10) | ≈ 75 |
| **Disponible** | **≈ 105** |

El consumo es una estimación: hay que confirmarlo en el registro de tiempo y decidir si la
preparación del entorno cuenta dentro de las 3 h (D-05).

### Corte revisado contra el tiempo disponible
El corte de la épica (175 min) **ya no entra**. El nuevo corte prioriza la decisión que el comité
tiene que poder verificar: el caso base de punta a punta, con los caminos de falla más riesgosos testeados.

| Bloque | Qué incluye | Forma | Minutos |
|---|---|---|---|
| **Vertical slice** | Una función de evaluación que cubre HU-001 a HU-004, decide la derivación de HU-005 (motivo y evidencia, sin llamar al sistema) y devuelve el registro de HU-008 | Código + mocks con los datos del enunciado | 45 |
| **Tests** | Caso base completo + 6 criterios negativos: fuente degradada descartada, sin eventos → `UNVERIFIED`, opción vencida, versión de política reemplazada, regla desconocida, ninguna opción viable | Tests automáticos | 20 |
| **Capa complementaria** | Especificación del mensaje al pasajero (HU-006 y HU-010) y pseudocódigo de HU-007 (idempotencia, 409 y 503) | Markdown | 10 |
| **README de ingeniería** | Síntesis de los documentos 1 a 13 en 2 páginas | Markdown | 15 |
| **AI Usage & Decision Note** | Síntesis del registro de uso de IA en 1 página | Markdown | 10 |
| **Margen** | Imprevistos | — | 5 |
| **Total** | | | **105** |

**Qué queda fuera del código y cómo se declara:**
- Llamadas reales a los sistemas de escritura: se entregan como pseudocódigo y contrato.
- Consulta compleja con opciones cerradas (HU-009): queda como un párrafo de diseño en el README,
  junto con la justificación de no usar IA en runtime (ADR-009).
- Los criterios negativos que no se testean se declaran como limitaciones conocidas.

**Si falta tiempo, se recorta en este orden:**
1. El pseudocódigo de HU-007 se reduce a la tabla de respuestas del documento 7.
2. Se testean 3 criterios negativos en lugar de 6.
3. **El caso base y su test no se recortan:** son la evidencia mínima del entregable 1.

### Track
Este corte supone el track **Backend/Integración**. Es el que permite verificar en código las
decisiones de mayor riesgo del caso (política, filtro de opciones y derivación). La decisión formal
está pendiente en ADR-001.
