# 14. OKR — Objetivos y resultados clave

Los OKR traducen los objetivos estratégicos (documento 1) y los indicadores (documento 5) en **apuestas
de cambio con plazo**. La épica EP-01 y sus historias son las **iniciativas** que mueven estos resultados.

```
Objetivo estratégico (OE)  ──►  Objective (O)  ──►  Key Results (KR)  ◄──  Iniciativas (EP-01, HU)
     por qué existe               qué queremos         cómo sabemos          qué hacemos
     el producto                  lograr este          que lo logramos
                                  trimestre
```

## 14.1 Convenciones
- **Período:** el primer trimestre de operación (fase 0, modo sombra, y fase 1, piloto MVP; documento 13).
- **Tipos de KR:**
  - **Resultado:** se busca moverlo y la meta es ambiciosa.
  - **Límite:** no se debe cruzar y la meta es obligatoria. No se califica con el 70 % que se suele aceptar como buen resultado en los OKR.
- **Metas:** son supuestos mientras no exista la línea base (P-19). Se fijan con los datos del modo sombra y del grupo de control.
- **Calificación:** de 0,0 a 1,0 por KR de resultado; 0,7 se considera un buen resultado. Un KR de límite se califica **cumplido o no cumplido**, y si no se cumple, el objetivo completo se considera no logrado.

---

## 14.2 O1 · Que el pasajero con un vuelo modificado resuelva sin llamar, con información en la que pueda confiar

**Apoya:** OE-1 (costo de atención), OE-2 (costo del error) y OE-4 (confianza del pasajero).

| KR | Resultado clave | Tipo | Fórmula | Línea base | Meta | Fuente | Indicador |
|---|---|---|---|---|---|---|---|
| KR1.1 | Bajar la tasa de contacto al call center después de la disrupción | Resultado | Contactos dentro de las 24 h ÷ reservas con modificación relevante atendidas | Grupo de control (P-19) | −20 % frente al control | Registro de decisiones + call center | OV-1 |
| KR1.2 | Mantener las recomendaciones incorrectas por debajo del punto de equilibrio | **Límite** | Respuestas automáticas corregidas, revertidas o reclamadas ÷ respuestas automáticas | Medida en el modo sombra | Menor que `e_max` (documento 10, §10.5) | Registro + casos L2 + reclamos | OV-2 |
| KR1.3 | Ninguna acción de alto impacto sin control | **Límite** | Solicitudes de cambio sin key, sin `policy_ref` vigente o sin la aprobación que exige la regla | — | 0 | Registro de decisiones | OV-2 |
| KR1.4 | Responder antes de que venzan las opciones | Resultado | p95 de `respuesta − recorded_at del evento relevante` | Medido en el modo sombra | Menor que la vigencia de las opciones (120 s) para el 95 % | Registro de decisiones | IA-2 |
| KR1.5 | Que la recomendación se acepte | Resultado | Solicitudes de cambio creadas ÷ respuestas con `ACCEPT_OPTION` | Sin línea base | Por lo menos 60 % (supuesto) | Registro de decisiones | IA-3 |

**Por qué este conjunto:** KR1.1 empuja a automatizar más, mientras que KR1.2 y KR1.3 frenan la
automatización riesgosa. KR1.4 y KR1.5 son adelantados: avisan semanas antes que KR1.1 si el
producto va mal encaminado.

## 14.3 O2 · Operar la disrupción con un criterio único, trazable y a costo controlado

**Apoya:** OE-2 (costo del error y cumplimiento) y OE-3 (eficiencia de la operación humana).

| KR | Resultado clave | Tipo | Fórmula | Línea base | Meta | Fuente | Indicador |
|---|---|---|---|---|---|---|---|
| KR2.1 | Que cada decisión se pueda reconstruir | **Límite** | Decisiones con `policy_ref`, `rule_ids`, eventos usados y descartados, y resultado ÷ decisiones | — | 100 % | Registro de decisiones | Trazabilidad |
| KR2.2 | Que L2 resuelva sin volver a contactar al pasajero | Resultado | Casos derivados resueltos sin recontacto ÷ casos derivados | Casos actuales de L2 (P-19) | Por lo menos 80 % (supuesto) | Casos L2 | IA-4 |
| KR2.3 | Reducir el tiempo de atención de los casos derivados | Resultado | Tiempo medio de atención de los casos del Companion frente a los casos actuales de L2 | P-19 | −25 % (supuesto) | Casos L2 | IA-4 |
| KR2.4 | Que el modo sombra valide el criterio antes del piloto | Resultado | Casos reales evaluados en sombra con su resultado comparado contra la decisión del agente | 0 | Una muestra suficiente para estimar OV-2 con un margen de ±0,2 puntos porcentuales (tamaño a calcular con el volumen de P-19) | Modo sombra | OV-2 |
| KR2.5 | Ningún dato personal en registros ni en la evidencia de los casos | **Límite** | Hallazgos de datos personales en el registro y en la evidencia enviada a L2 | — | 0 | Revisión automática del registro | Privacidad |

**Por qué este conjunto:** O1 mira al pasajero y O2 mira a la operación. Sin O2, se podría
"lograr" O1 derivando todo a L2 sin evidencia, o automatizando sin traza.

---

## 14.4 Iniciativas que mueven cada KR

| KR | Iniciativas (EP-01) | Cómo lo mueve |
|---|---|---|
| KR1.1 | HU-001 a HU-004, HU-006, HU-007 | Respuesta completa y opción ejecutable sin llamar |
| KR1.2 | HU-001, HU-003, HU-004 y el modo sombra | Datos verificados, política vigente, filtro de opciones y medición antes de exponer al pasajero |
| KR1.3 | HU-007 | Confirmación, idempotencia y manejo de 409 y 503 |
| KR1.4 | HU-001 (lecturas en paralelo), HU-006 | Latencia acotada y aviso inmediato |
| KR1.5 | HU-004, HU-006, HU-010 | Una opción viable para todo el grupo, explicada con claridad |
| KR2.1 | HU-008 | Un registro por decisión |
| KR2.2 y KR2.3 | HU-005 | Motivo de un catálogo cerrado y evidencia completa |
| KR2.4 | Modo sombra (fase 0, documento 13) | Comparación con la decisión del agente |
| KR2.5 | HU-005, HU-008, ADR-007 | Datos personales fuera del registro y de la evidencia (no hay modelos en runtime, ADR-009) |

## 14.5 Cadencia
| Momento | Qué se revisa | Quién |
|---|---|---|
| Semanal | KR adelantados (KR1.4, KR1.5, KR2.1, KR2.5) y límites | Equipo de producto |
| Quincenal | KR1.2 y KR2.4 durante el modo sombra; decisión de pasar al piloto | PM + Team Lead + dueño de las políticas |
| Mensual | KR1.1, KR2.2 y KR2.3 (necesitan el cruce con el call center y L2) | PM + operación |
| Cierre del trimestre | Calificación y OKR del trimestre siguiente | Equipo completo |

**Regla de parada:** si cualquier KR de límite se rompe, se reduce el perímetro automático (más casos a
una persona) antes de seguir persiguiendo KR1.1.

## 14.6 Riesgos de manipulación de las métricas
| Riesgo | Cómo se previene |
|---|---|
| Bajar KR1.1 dificultando el contacto al call center | KR1.1 mide contactos evitados, no contactos bloqueados; el canal de contacto nunca se oculta |
| Bajar KR1.2 derivando todo a una persona | O2 lo hace visible: sube la carga de L2 y el KR2.3 empeora; IA-1 se observa |
| Subir KR1.5 ofreciendo sólo opciones fáciles de aceptar | El filtro de opciones es determinístico y trazable (KR2.1); no depende de la tasa de aceptación |
| Excluir casos difíciles del modo sombra | La muestra de KR2.4 se toma al azar sobre todas las disrupciones del escenario |

## 14.7 Lo que falta para cerrar los OKR
- La línea base de contactos, de tiempo de atención en L2 y de costos (P-19): define las metas de KR1.1, KR2.2, KR2.3 y `e_max`.
- El volumen mensual de disrupciones (P-19): define el tamaño de la muestra de KR2.4.
- Un responsable por OKR, cuya disponibilidad está por confirmar (P-27). Propuesta: el PM es dueño de O1 y el Team Lead, de O2.
