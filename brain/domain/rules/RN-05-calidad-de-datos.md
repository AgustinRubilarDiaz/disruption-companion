# RN-05 · Datos operacionales: fuente, timestamp y frescura ✅ Dada (resolución abierta)

**Fuente:** enunciado §2 (consideraciones de las tools) y §3 ("pueden estar desactualizados o ser
contradictorios entre fuentes").

## Qué dice
- `get_trip_context` puede devolver información parcial (`_meta.completeness`, `missing_fields`).
- `get_operational_events` requiere controlar timestamp, fuente y frescura.
  Trae `source` y `recorded_at` por evento, y `_meta.sources_available` / `sources_degraded`.

## Cómo se aplica (lo que es fijo)
- Ningún dato se usa sin conservar su `source` y su timestamp: son parte de la evidencia.
- Un campo listado en `missing_fields` no se rellena con un valor supuesto.
- Una fuente en `sources_degraded` se identifica como tal en la evidencia.

## Abierto — no implementar sin decisión del usuario
- Regla de resolución cuando dos fuentes se contradicen (prioridad, recencia, ambas) (H-05).
- Umbral de frescura a partir del cual un dato se considera desactualizado (H-05).
- Qué hacer cuando faltan campos necesarios para decidir (H-09).
