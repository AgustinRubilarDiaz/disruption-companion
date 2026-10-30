# Jerarquía de confianza entre fuentes

Cuando dos fuentes se contradicen, gana la de número menor. No se promedia ni se elige a criterio.

## Sobre reglas de negocio
1. **Enunciado** — `Docs/Disruption_Companion.pdf`. Lo que dice explícitamente es ✅ Dado.
2. **Decisiones del usuario** registradas (ADR en `architecture/adr/` o 🟡 en `KNOWLEDGE_BASE.md`).
3. **El Brain** (`KNOWLEDGE_BASE.md`, `domain/rules/`).
4. **Supuestos** — viven en `HALLAZGOS.md` y **no** son reglas hasta que el usuario los confirme.

Un ejemplo del enunciado ("ejemplo representativo") ilustra el contrato; no fija reglas de negocio
más allá de lo que muestra.

## Sobre el estado técnico
1. **Código y archivos de build** (`package.json`, `pyproject.toml`, `Dockerfile`, CI) — lo que se ejecuta.
2. **El Brain** — curado, pero puede haber envejecido.
3. **README** — nunca tomar versiones de acá.

## Sobre datos operacionales (dentro del producto)
Distinto de lo anterior: es una **regla de negocio abierta** (H-05). No usar esta jerarquía para
resolver conflictos entre `OPS_CORE`, `AIRPORT_FEED` y `LEGACY_MIRROR`.
