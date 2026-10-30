# 00 · Prompts usados para los documentos de entrada (01 a 14)

Prompts reales, copiados textualmente del historial del agente de código (Cursor), en el orden en
que se usaron el 2026-10-29. Se dejan sin corregir. El proceso completo está en
[`00-proceso-documentacion.md`](00-proceso-documentacion.md); el análisis previo del enunciado se
hizo en el [cuaderno de NotebookLM](https://notebooklm.google.com/notebook/7d959f64-6aa0-42ea-b2b7-e58594bd9195).

Todos se ejecutaron con el Brain cargado: el agente lee `brain/CLAUDE.md`, no decide reglas de
negocio y registra lo que el enunciado no define como pregunta abierta.

---

## 1 · Documentos 01 a 08 (15:50)

> revisa /Users/arubilad/dev/challenge/disruption-companion/Docs/Disruption_Companion.pdf necesito
> estudiar el requerimiento, extraer lo necesario para comenzar tener documentación definir objetivo
> principal, atributos de valor, descripcion del producto, definicion del negocio, identificar dos
> objetivos de valor que se puedan medir, atributos funcionales, logicas de los contratos, y todo en
> diferentes archivos .md, si es posible deducir un flujo, no buscamos complejizar debemos ajustarnos
> a los requerimientos y pensar en escalabilidad

**Resultado:** `brain/product/01` a `07` y las primeras preguntas abiertas en `HALLAZGOS.md`.
**Por qué funciona:** enumera los artefactos esperados, pide un archivo por tema y pone un límite
explícito ("no buscamos complejizar").

## 2 · Copia limpia y documento 09 (16:03)

> tienes que dejar una copia limpia en la carpeta docs, con los md separados como base inicial

**Resultado:** `Docs/01` a `Docs/09` y `Docs/README.md`, sin referencias internas del Brain.

## 3 · Documentos 10 a 12 (16:31)

> mantengamos profundidad:
> necesito repasar la documentacion para ver si contamos con:
>
> El problema y los objetivos del negocio
> • El dolor principal: ¿Qué problema exacto busca resolver el software y por qué urge solucionarlo ahora?
> • Objetivos estratégicos: ¿Qué meta de negocio apoya este software (ej. reducir costos en un 20%, aumentar ventas, ahorrar tiempo operativo)?
> • Métricas de éxito (KPIs): ¿Cómo sabrá el negocio si el software funcionó? ¿Qué número debe mejorar?
>
> y el AS IS, es bajo porque no contamos con mucho estado actual, hay que centrarse en cómo debería
> funcionar el negocio mañana y qué impacto financiero u operativo se busca.
>
> identificar Reglas de negocio y restricciones
> Sistemas y tecnología existente

**Resultado:** `Docs/10`, `11` y `12`; correcciones en `01` y `05`.
**Por qué funciona:** es una lista de verificación, no un pedido de texto: obliga a declarar lo que
falta (AS-IS, línea base) en vez de inventarlo.

## 4 · Documento 13 (16:42)

> evaluacion de Alcance, presupuestos y plazos • Priorización: De todo lo que el negocio quiere,
> ¿qué es lo mínimo indispensable para que funcione el producto (MVP o producto mínimo viable) y qué
> puede esperar para una segunda fase? • Tiempos y recursos: ¿Existe una fecha tope crítica (por una
> ley, una temporada de ventas o un contrato) y quiénes por parte del cliente estarán disponibles
> para validar los avances?

**Resultado:** `Docs/13` y las preguntas H-26 a H-28 (fecha tope, validadores, presupuesto).

## 5 · Documento 14 (16:50)

> sabes lo que es un OKR ?

El agente explicó el concepto y propuso cómo aplicarlo al producto. Luego:

> si

**Resultado:** `Docs/14`, con los resultados clave vinculados a OV-1 y OV-2.
**Por qué funciona:** verificar primero que el agente entiende el concepto evita un documento
genérico.

---

## Prompts relacionados (fuera de 01 a 14)

| Hora | Prompt (resumen) | Resultado |
|---|---|---|
| 16:12 | Propuesta de épica con mapa de ruta, HU y criterios de aceptación | `epica/EP-01` |
| 16:58 | Revisar una evaluación externa, sin hacer cambios: "preguntame antes de ajustar algo" | Informe de cobertura |
| 17:14 | Documento de evolución según el evaluador | `Docs/15` |
| 17:18 | Revisar la evaluación del comité | Ajustes al contrato de salida y al track |
