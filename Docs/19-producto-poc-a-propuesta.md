# 19 · Producto: de la POC a la propuesta

- **Estado:** UX-01 implementada en `feature/UX-01` (41 tests jsdom + 3 Playwright en verde), pendiente de merge a `dev`.
- **Idea:** Disruption Companion es un producto. Su versión POC (`v0.1.0-poc`) cubre el desafío
  completo, y desde ahí evoluciona hacia la propuesta de producto. La evolución tiene criterio libre,
  pero nunca rompe lo que el desafío ya cubre.

---

## 19.1 Dos etapas

| Etapa | Qué es | Dónde vive | Quién la evalúa |
|---|---|---|---|
| **POC** | Cobertura total del desafío: motor, contrato v1.0, pantalla, aceptación de la opción | `main` · tag `v0.1.0-poc` | El comité del desafío |
| **Propuesta** | Evoluciones de producto: experiencia, plataforma y funciones (`Docs/15`) | `dev` → `main` con un tag por versión | El negocio, con métricas |

El envío del desafío (`github_url`, `api_url`) apunta a la POC: `main` no recibe evoluciones hasta que
el envío esté hecho, y la `api_url` se despliega desde `main`.

## 19.2 Reglas de la evolución

1. **El contrato es la frontera.** Una evolución que sólo usa `DisruptionAssessment` v1.0 es libre.
   Si necesita datos nuevos, primero sube la versión menor del contrato (1.x, Docs/16 §16.4) y
   después la consume la pantalla.
2. **La pantalla no decide.** Ninguna evolución de experiencia mueve reglas de negocio al frontend.
3. **Lo que la POC garantiza sigue garantizado.** Sus dos `.feature` y sus tests siguen pasando en
   cada evolución.
4. **Cada evolución tiene métrica.** Es el criterio de `Docs/15` §15.1, con métricas de experiencia
   para las `UX-xx`.
5. **Ramas y versiones.** `main` es productiva. `dev` integra. Cada evolución va en `feature/<ID>`
   desde `dev`. Se libera con un merge aprobado de `dev` a `main` y un tag semántico (`v0.2.0`, …).

## 19.3 Catálogo de evoluciones

| ID | Evolución | Depende de | Métrica |
|---|---|---|---|
| **UX-01** | Pantalla moderna con el contrato actual (§19.4) | — | Tiempo hasta decidir; tasa de abandono de la confirmación |
| UX-02 | Telemetría de la pantalla sin datos personales (eventos con `decision_id`) | Decisión de herramienta | Habilita medir UX-01 y OV-1 |
| UX-03 | Accesibilidad AA auditada (lector de pantalla, teclado, contraste) | UX-01 | Errores de auditoría = 0 |
| UX-04 | Idiomas (es, pt, en) por la red de LATAM | UX-01 | Cobertura de rutas por idioma |
| UX-05 | Enlace seguro desde el aviso proactivo (sin selector, con autenticación) | EV-11, H-24 | Contactos evitados tras el aviso |
| PL-01 | Despliegue en Cloud Run desde `main` | Docker o Cloud Build | `api_url` estable |
| PL-02 | CI en GitHub Actions: tests de `engine/` y `web/` en cada PR | Repositorio publicado | PR sin tests en verde = 0 |
| PL-03 | Adaptadores reales de las 7 tools detrás del mismo puerto | Acceso a sistemas (H-24) | Paridad con los mocks en modo sombra |
| PL-04 | Persistencia de solicitudes y del registro de decisiones | PL-03 | Pérdida al reiniciar = 0 |

Las evoluciones funcionales (EV-08 a EV-12, capa regulatoria) siguen en `Docs/15`.

## 19.4 UX-01 · Pantalla moderna

Todo sale de campos que el contrato v1.0 ya trae. No hay cambios en `engine/`.

| Mejora | Detalle | Campos del contrato |
|---|---|---|
| Mobile-first + tarjeta principal | Estado con ícono, color semántico y título; nunca sólo color | `message`, `trip_status` vía plantilla |
| Línea de tiempo del itinerario | Cada segmento con vuelo, ruta, hora programada y nueva, puerta y estado. La conexión perdida se marca entre segmentos. Un segmento sin confirmar muestra sólo lo programado | `segments[]`, `impact.connection` |
| Comparación antes / ahora | El vuelo que se pierde contra la opción ofrecida | `impact.connection`, `segments[]`, `recommended_option` |
| Confirmación modal accesible | `role="dialog"`, foco atrapado, Escape cierra sin enviar, vuelve el foco al botón | — |
| Barra de vigencia | `role="progressbar"`; aviso en `aria-live` a los 30 s y al vencer | `valid_until`, `evaluated_at` |
| Pulido | Esqueleto de carga con `aria-busy`, transiciones que respetan `prefers-reduced-motion`, modo oscuro por `prefers-color-scheme` | — |
| Modo demo separado | Barra superior rotulada "Modo demo" con el selector y el reloj simulado. Enlace directo `/?booking=ABC123` | `GET /v1/scenarios` |

**Tecnología:**
- Tailwind CSS 4.3.3 con `@tailwindcss/vite` (compatible con Vite 8). Los tokens de diseño se declaran en CSS con `@theme`.
- Sin librería de componentes.
- Íconos SVG en línea.
- Playwright 1.64.1 para verificar en un navegador real: recorrido del caso base y capturas en móvil, escritorio y modo oscuro, que se suben a `Docs/img/`. Usa el Google Chrome instalado (`channel: 'chrome'`): la descarga de Chromium falla detrás del proxy corporativo que intercepta TLS, y no se desactiva la verificación de certificados para esquivarlo.

**Pruebas:**
- Los 24 tests actuales se adaptan a la nueva estructura sin perder ninguna verificación.
- Los escenarios de `brain/features/UX-01_pantalla-moderna.feature` se cubren con jsdom (la interacción) y con Playwright (lo visual y el flujo real).
- La verificación de campos prohibidos sigue en las tres reservas.

**Orden y estimación:**

| # | Paso | Min |
|---|---|---|
| 1 | `.feature` de UX-01 | 8 (**gate**) |
| 2 | Tailwind y tokens | 8 |
| 3 | View model ampliado (itinerario, comparación) y sus tests | 12 |
| 4 | Componentes: barra demo, tarjeta, línea de tiempo, comparación, vigencia, modal, esqueleto | 30 |
| 5 | Adaptar los tests de interacción y agregar los nuevos | 12 |
| 6 | Playwright: recorrido real y capturas | 15 |
| 7 | README y documentos | 5 |
| | **Total** | **≈ 90** |

## 19.5 Preguntas abiertas
- Identidad visual: ¿se usan colores y tipografía de marca? Por ahora, una paleta neutra propia.
- ¿Qué herramienta de telemetría se usa (UX-02)? Sin ella, las métricas de UX-01 no se pueden medir.
