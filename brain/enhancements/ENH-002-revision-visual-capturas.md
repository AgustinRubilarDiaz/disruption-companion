# ENH-002 · Revisión visual de las capturas en el gate pre-entrega

- **Fecha:** 2026-10-30
- **Commit:** _pendiente_

## Problema
En UX-01, los 3 tests de Playwright pasaban, pero al mirar las capturas aparecieron dos defectos:
- El diálogo de confirmación se capturó en el primer cuadro de su animación, con opacidad 0. El
  test pasaba igual porque Playwright considera visible un elemento con opacidad 0.
- En móvil, "+160 min" y las horas de la comparación se cortaban en dos líneas.

## Decisión
`e2e-closure` Momento 1 exige, cuando la HU toca la pantalla, correr `npm run test:e2e` y revisar
cada captura de `Docs/img/` antes de aprobar. Las capturas de elementos animados se toman con
`animations: 'disabled'`.

## Alternativas descartadas
- Comparación automática de capturas (`toHaveScreenshot`): útil para regresiones, pero no reemplaza
  la primera revisión humana y suma mantenimiento de imágenes de referencia. Queda para PL-02 (CI).
