# Disruption Companion — README de ingeniería

Caso A · track **Backend/Integración**. Ante un vuelo modificado, el servicio entrega **un solo
resultado validado**: qué pasó, qué le corresponde al pasajero, una única opción y el siguiente paso.
Si los datos se contradicen, faltan o hay una aprobación pendiente, deriva a una persona.
Entregable 1 (cómo correrlo, alcance, tests, limitaciones): [`EVIDENCIA.md`](EVIDENCIA.md) ·
Entregable 3: [`AI_USAGE.md`](AI_USAGE.md).

## 1. Problema y outcome esperado
El pasajero no sabe qué pasó ni qué hacer, y llama al call center. El riesgo opuesto es igual de
caro: informar algo no verificado o ejecutar un cambio que la política no respalda. **Outcome:**
menos contactos evitables (OV-1) con **0 acciones de alto impacto sin control** (OV-2). Las metas
salen del punto de equilibrio del error ([`Docs/10`](Docs/10-as-is-to-be-e-impacto.md) §10.5) y,
sin línea base, son hipótesis (H-16).

## 2. Supuestos y alcance
- **Alcance:** HU-001 a HU-008 y HU-010 implementadas; HU-009 (texto libre) en diseño. Sólo `DELAY`,
  con mocks que respetan los contratos del enunciado.
- **Supuestos** (configurables, abiertos en [`HALLAZGOS.md`](HALLAZGOS.md)): frescura de 30 min,
  MCT de 0 min, fuentes degradadas descartadas, horas locales sin zona horaria y motivos de descarte cerrados.
- **Ambigüedades del §4:** cómo se resolvió cada una, en [`Docs/09`](Docs/09-supuestos-y-preguntas-abiertas.md)
  y en los ADR 003 a 007. Regla general: ante la duda no se afirma. Un dato en conflicto o ausente da
  `UNVERIFIED` y una derivación, nunca "sin cambios".

## 3. Decisiones y alternativas descartadas

| Decisión | Descartada | Criterio |
|---|---|---|
| Track Backend ([ADR-001](brain/architecture/adr/ADR-001-track-backend-integracion.md)) | Frontend | "Qué corresponde" se demuestra con tests |
| Sin IA en runtime ([ADR-009](brain/architecture/adr/ADR-009-sin-ia-en-runtime.md)) | LLM que interpreta y redacta | Alucinar es el error a evitar; hay alternativa determinística |
| Conflicto de fuentes → `UNVERIFIED` + persona ([ADR-003](brain/architecture/adr/ADR-003-consolidacion-de-eventos.md)) | Gana la más reciente | Afirmar un estado falso cuesta más que derivar |
| Política con gramática acotada ([ADR-004](brain/architecture/adr/ADR-004-evaluacion-de-politicas.md)) | Evaluar `condition` libre | Una regla desconocida se deriva, no se adivina |
| Aprobación por entitlement (RN-07) | Todo a una persona | Lectura literal; se endurece en la política sin tocar código |
| 503 → misma clave, luego persona ([ADR-006](brain/architecture/adr/ADR-006-escrituras-de-alto-impacto.md)) | Reintentar con otra clave | El 503 es indeterminado: duplicaría el cambio |
| Contrato único v1.0 ([ADR-008](brain/architecture/adr/ADR-008-contrato-de-salida.md)) | Exponer las tools | La pantalla no decide; 10 invariantes antes de responder |

## 4. Clasificación de pasos

| Paso | Clasificación | Razón | Riesgo | Control / fallback |
|---|---|---|---|---|
| Elegir la consulta | Determinístico | Opciones cerradas | No encuentra su caso | "Hablar con una persona" |
| Consolidar eventos | Determinístico | Reglas de fuente y frescura | Dato viejo | Conflicto → `UNVERIFIED` + persona |
| Impacto, política, opción | Determinístico | Política versionada | Regla mal mapeada | Tests; regla desconocida o sin opción → persona |
| R4, R5, conflicto, 503 | **Human** | Lo exige la política o es incierto | Carga de L2 | Caso con evidencia sin datos personales |
| Mensaje | Determinístico | Plantilla con hechos | Texto rígido | Sin `policy_ref` no se construye |
| Aceptar la opción | Determinístico + pasajero | Alto impacto | Duplicar | Idempotencia y reevaluación |
| Texto libre (HU-009) | AI-assisted (diseño) | Escribir con sus palabras | Mala lectura | Catálogo cerrado; duda → persona |

**Agentic: ninguno.** El orden de las tools es fijo; un agente sumaría no determinismo sin beneficio.

## 5. Consulta ambigua o compleja (§5.2)
*"¿Pierdo la conexión? Viajo con mi hijo y quiero que me compensen."* Se descompone en subtareas
determinísticas: verificar el retraso pese a las fuentes contradictorias, calcular la conexión
perdida, evaluar R3, R4 y R5, y elegir la opción. **Se detiene** en R4 (compensación) y R5 (menor): pasan a una persona en paralelo, sin bloquear el
cambio de vuelo que R3 otorga. Diseño completo y dónde aportaría la IA: [`Docs/20`](Docs/20-consulta-compleja.md).

## 6. Riesgos y próximos pasos
- **Datos reales distintos a los mocks:** las tools están detrás de un puerto. Siguiente paso:
  adaptadores reales en modo sombra (PL-03).
- **Política sin respuesta → 500 (H-29):** definir un mensaje genérico aprobado.
- **Escrituras duplicadas entre evaluaciones (H-30, H-31):** definir quién deduplica en producción.
- **Zona horaria y MCT (H-07):** tabla de aeropuertos.
- **Sin autenticación:** enlace seguro desde el aviso (UX-05).
- **Evolución de la POC a la propuesta:** [`Docs/15`](Docs/15-evolucion-y-recomendaciones.md) y
  [`Docs/19`](Docs/19-producto-poc-a-propuesta.md).

## 7. Cómo lo validé
- **Antes de escribir código:** resolví el caso base a mano ([`Docs/08`](Docs/08-flujo.md)) y aprobé
  el contrato y cada `.feature`.
- **Tests, todos en verde:** 51 en el motor (uno por escenario; `ABC123` igual al fixture campo a
  campo; invariantes y ausencia de datos personales en cada reserva), 41 de la pantalla con jsdom y
  3 en un navegador real.

## 8. Cómo se construyó la documentación
- **Proceso:** [`Docs/00-proceso-documentacion.md`](Docs/00-proceso-documentacion.md) explica los
  pasos que generaron `Docs/01` a `Docs/14`. Antes, el PDF se cargó en un
  [cuaderno de NotebookLM](https://notebooklm.google.com/notebook/7d959f64-6aa0-42ea-b2b7-e58594bd9195)
  para un análisis limpio y cerrado, que dio los puntos de entrada del harness (`brain/`).
- **Prompts usados:** [`Docs/00-prompts-documentos-entrada.md`](Docs/00-prompts-documentos-entrada.md).
