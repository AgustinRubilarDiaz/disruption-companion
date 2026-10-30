# AI Usage & Decision Note

## Herramientas y para qué
- **NotebookLM:** análisis limpio y cerrado del PDF; dio los puntos de entrada del harness ([`Docs/00`](Docs/00-proceso-documentacion.md)).
- **Cursor con Claude:** documentación, contrato, BDD, código y tests, guiado por un harness propio
  (`brain/`) con gates que no puede saltar:
  - Sin plan y `.feature` aprobados, no hay código.
  - No decide reglas de negocio: lo que el enunciado no define va a `HALLAZGOS.md`.
  - No commitea ni publica sin aprobación.

**Tiempo efectivo: 180 min** = análisis y documentación 75 · POC 80 · pantalla y UX-01 25. La
preparación del harness (Brain) fue preparación del entorno de trabajo y no está incluida.

## Outputs aceptados, modificados y rechazados ([detalle por sesión](brain/operations/ai-usage-log.md))

| Output de la IA | Qué hice | Cómo lo validé |
|---|---|---|
| `Docs/01–14` y caso base | Aceptados; pedí más profundidad | Contra el PDF |
| Meta de error del 1 % | **Modificado:** el análisis de equilibrio mostró un neto negativo; la meta se deriva de la economía | `Docs/10` §10.5 |
| Contrato `DisruptionAssessment` y `.feature` | Aprobados como gate antes del código | La salida de `ABC123` es igual al fixture, campo a campo |
| Motor y tests | Aceptado con recorte: 3 reservas de demostración en vez de 7 | 51 tests; un test por escenario |
| Escrituras en cada consulta · clave por cantidad de pasajeros | **Corregidos:** cada refresco creaba un caso; dos grupos iguales en tamaño compartían clave (FALLA-001) | Tests de idempotencia |
| Pantalla moderna (UX-01) | Aceptada; las capturas mostraron 2 defectos que los tests no veían | Playwright en Chrome y revisión de capturas |
| Desactivar TLS para descargar Chromium · "`Docs/15` contradice P-17" | **Rechazados:** se usa el Chrome instalado; no la contradecía | Relectura |

## Decisiones que tomé yo
- **Stack y producto:** track Backend con TypeScript + Node; pantalla en React que no decide nada;
  `main` productiva y `dev` de integración.
- **Sin IA en runtime** (ADR-009): alucinar es justo el error que el producto debe evitar.
- **P-17:** cada entitlement tiene su propia aprobación. R3 ofrece O1 en automático y R5 (menor) se
  deriva en paralelo.
- **Ante la duda, no afirmar:** un dato en conflicto o ausente da `UNVERIFIED` y pasa a una persona.
  Los supuestos de la POC (frescura, MCT, descartes) quedan abiertos, no decididos.
## Lo que nunca le daría a un modelo
- **Datos personales reales** (nombre, correo, teléfono, documento, fidelidad): sólo se usaron los
  del ejemplo del enunciado, y ni la respuesta ni los logs los contienen.
- **Credenciales, tokens o escrituras de alto impacto:** cada push requiere mi aprobación y el envío
  final lo hago yo.
