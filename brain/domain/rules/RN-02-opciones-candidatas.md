# RN-02 · Las opciones elegibles son candidatas, no decisiones ✅ Dada

**Fuente:** enunciado §2 ("Entrega opciones candidatas, no una decisión final").
Fixture: `contracts/fixtures/get_eligible_options.json`.

## Qué dice
`get_eligible_options` devuelve alternativas (`REBOOK`, `REFUND`) con `policy_ref`, `confidence`
(`HIGH` / `MEDIUM` / `LOW`) y una vigencia (`_meta.ttl_seconds: 120`).

## Cómo se aplica
- La lógica propia filtra y ordena; la tool no decide.
- Una opción se contrasta contra: la política vigente (RN-01), las condiciones de tarifa del
  booking y la vigencia del listado.
- Una opción vencida (pasó `retrieved_at + ttl_seconds`) no se ofrece sin volver a consultar.

## Abierto
- Criterios de filtrado: asientos vs tamaño del grupo, diferencia de tarifa vs `REBOOK_NO_FEE`,
  refund sobre tarifa no reembolsable, umbral de `confidence` (H-08).
