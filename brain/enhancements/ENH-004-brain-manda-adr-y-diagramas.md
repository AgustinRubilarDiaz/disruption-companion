# ENH-004 · El Brain manda sobre `Docs/`, ADR-003 a ADR-008, diagramas y CLAUDE.md por componente

- **Fecha:** 2026-10-30
- **Decide:** usuario (alcance completo de la Fase B, rama `feature/BRAIN-B` desde `dev`)
- **Commit:** _pendiente_

## Problema
Después de la Fase A (ENH-003) seguían cinco huecos frente al manual:
1. `brain/product/README.md` decía que `Docs/` mandaba, y `Docs/10` a `14` y `16` sólo existían allá.
2. Dos numeraciones para lo mismo: `P-XX` en `Docs/` y `H-XX` en el Brain; `RD-XX` sin relación con `RN-XX`.
3. ADR-003 a ADR-008 reservados y sin escribir, aunque la POC ya implementaba cada decisión.
4. `engine/` y `web/` sin `CLAUDE.md` de nivel 3.
5. Sin diagrama de contenedores ni de modelo de datos; los diagramas nunca se validaron (H-91).

## Decisiones
1. **Contenido:** las versiones de `Docs/` eran más completas, así que se adoptaron en el Brain
   (`product/01…06, 08, 10…14`, `contracts/logica-contratos.md`, `contracts/disruption-assessment.md`).
   `product/07-flujo.md` pasa a `08-flujo.md`: la numeración es la misma en los dos lados.
2. **Copia generada:** `operations/sync-docs.sh` regenera `Docs/` (25 archivos, incluida `Docs/epica/`
   con una HU por archivo) y `--check` detecta si quedó desactualizada. Quedan a mano: `Docs/09`
   (resumen de `HALLAZGOS.md`) y `Docs/15`, `17`, `18`, `19` (entregables y planes).
3. **IDs:** `P-NN` → `H-NN` en todo lo que no es código. Las `P-29…P-32` de `Docs/15` chocaban con
   `H-29…H-32` y pasan a `H-38…H-41`. Los comentarios del código (`P-07`, `P-17`) no se tocaron.
4. **RD → RN no es un renombre:** las RD son supuestos de la POC sobre preguntas abiertas, y la KB no
   admite lo abierto como RN. `product/11` agrega a cada RB su RN y a cada RD su estado (supuesto +
   ADR, o decidida: RD-11 → RN-03, RD-13 → RN-07). La KB lo explica.
5. **ADR-003 a ADR-008** en estado **Propuesto**, escritos desde el código. El usuario los acepta.
6. `engine/CLAUDE.md` y `web/CLAUDE.md` desde `init-component`; ADR-001 con enmienda (la capa
   complementaria se implementó, ADR-010).
7. Diagramas de contenedores y de modelo de datos en `architecture/diagrams.md`, validados con
   `mermaid-cli` usando el Chrome instalado (H-91 resuelto).

## Hallazgos (el código no coincidía con lo documentado)
- **H-13 / RD-12:** la épica y `Docs/07` decían "un predicado por `rule_id`"; `policy.ts` es un
  intérprete acotado. Se corrigió la documentación; la elección queda en ADR-004.
- **H-36:** la clave de idempotencia usa `passenger_count`, no `passenger_ids` (RD-11 y `Docs/07` se
  alinearon a lo implementado); el puerto `Tools` difiere de `tools-api.md` en `get_eligible_options`.
- **H-37:** `missing_fields_critical` es siempre `false`; lo que H-09 describe no está implementado.

## Alternativas descartadas
- Mantener `Docs/` como fuente y el Brain como copia: contradice el manual y ENH-003.
- Editar las dos copias a mano: ya se habían desincronizado una vez.
- Renombrar RD → RN: convertiría supuestos en reglas sin decisión del usuario.
