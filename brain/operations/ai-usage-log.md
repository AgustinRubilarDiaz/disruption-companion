# Registro de uso de IA y de tiempo

> Insumo directo del **Entregable 3 — AI Usage & Decision Note** (máx. 1 página) y control del
> presupuesto de **3 h efectivas**. Se completa en cada sesión (lo propone `brain-update`).

## Tiempo efectivo

| Sesión | Fecha | Duración | Qué se hizo | Acumulado |
|---|---|---|---|---|
| 0 | 2026-10-29 | _completar_ | Bootstrap del Brain (harness) | _completar_ |
| 1 | 2026-10-29 | ≈ 75 min de reloj (15:32–16:45), _a confirmar_ | Análisis del enunciado, `Docs/01–13`, épica EP-01 | ≈ 75 min si el bootstrap cuenta (D-05) |
| 2 | 2026-10-29 | Reloj ≈ 16:50–21:25, efectivo _a confirmar_ | Evaluaciones externas, `Docs/14–17`, P-17, `.feature` EP-01, `engine/` y sus tests, README y AI_USAGE | _a confirmar_ |
| 3 | 2026-10-29 | Reloj desde 22:45, efectivo _a confirmar_ | `Docs/18`, `.feature` de la pantalla, aceptar la opción (HU-007), `web/` en React | _a confirmar_ |
| 4 | 2026-10-30 | Reloj ≈ 07:35–11:30, efectivo _a confirmar_ | Prueba local, visión de producto (`Docs/19`), POC congelada y ramas, UX-01 con Tailwind y Playwright | _a confirmar_ |

> Decisión del usuario pendiente: ¿el bootstrap del harness cuenta dentro de las 3 h? (D-05).
> Las sesiones 3 y 4 son evolución de producto posterior a la POC; conviene declarar en la entrega si
> cuentan dentro de las 3 h.

## Uso de IA

| Fecha | Herramienta / modelo | Para qué | Resultado | Cómo se validó |
|---|---|---|---|---|
| 2026-10-29 | Cursor agent | Generar el Brain desde el manual y el enunciado | _aceptado / modificado / rechazado_ | Revisión del usuario contra el PDF |
| 2026-10-29 | Cursor agent | Extraer documentación de producto (`product/`), lógica de contratos y flujo con el caso base resuelto | _pendiente de revisión_ | Revisión del usuario contra el PDF; metas y opciones marcadas 💡 hasta su decisión |
| 2026-10-29 | Cursor agent (Claude) | Contrastar la documentación con dos evaluaciones simuladas | Modificado: el usuario eligió ajustar sólo el contrato de salida y el track | Revisión del usuario |
| 2026-10-29 | Cursor agent (Claude) | Plan `Docs/17`, recomendación de P-17, `.feature` EP-01, `engine/` | Aceptado con recorte: 3 reservas de demostración en vez de 7 | 43 tests; la salida de `ABC123` se compara con el fixture resuelto antes del código |
| 2026-10-29 | Cursor agent (Claude) | Plan de pantalla `Docs/18`, `web/` y aceptar la opción | Aceptado. El agente detectó que cada refresco creaba un caso y una notificación nuevos, y se corrigió antes de la pantalla (H-30) | Tests de interacción con jsdom; fixtures generados por el motor real |
| 2026-10-30 | Cursor agent (Claude) | `Docs/19`, `.feature` UX-01, pantalla moderna, Playwright | Aceptado. Revisar las capturas destapó dos defectos que los tests no veían (ENH-002). Se rechazó desactivar la verificación TLS para descargar Chromium: se usa el Chrome instalado | 41 tests jsdom + 3 Playwright; capturas revisadas |
| 2026-10-30 | Cursor agent (Claude) | Correcciones del propio agente | El agente dijo que `Docs/15` contradecía P-17 y no era así: se agregó una nota aclaratoria. Una fila duplicada en `Docs/README` se corrigió | Revisión del usuario |

## Decisiones tomadas personalmente (no delegadas)
- Track Backend/Integración, TypeScript + Node, servicio HTTP (ADR-001, ADR-002, D-04).
- Sin IA en runtime (ADR-009).
- P-17: cada entitlement sigue su propia bandera de aprobación (RN-07).
- Recorte por tiempo de la POC (3 reservas de demostración).
- Pantalla en React, alcance ver + aceptar, y las 5 decisiones de `Docs/18` §11 (ADR-010).
- Ver el proyecto como producto: POC congelada, `main` productiva y `dev` de integración (ADR-011).
- Las 7 mejoras de UX-01, Tailwind y Playwright.
- Dejar abiertos los supuestos de la POC (H-05, H-07, H-08) en lugar de darlos por decididos.

## Información que nunca se entrega a un modelo
- PII real de pasajeros (RN-06). Sólo se usaron los datos de ejemplo del enunciado.
- Credenciales o tokens: el push a GitHub lo hace el usuario.
- El envío final del formulario de entrega lo hace el usuario, una sola vez.
