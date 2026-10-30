# AI Usage & Decision Note

## Cómo usé la IA
Trabajé con un agente de código (Cursor, modelo Claude) guiado por un "Brain" propio (`brain/`): reglas
de trabajo, skills por fase y gates que el agente no puede saltar. El agente no decide reglas de
negocio: cuando algo no está en el enunciado, lo registra como pregunta abierta (`HALLAZGOS.md`) y espera.

| Fase | Qué hizo la IA | Qué hice yo |
|---|---|---|
| Análisis | Extraer del PDF objetivo, reglas, contratos de las tools y resolver el caso base a mano | Revisar contra el PDF y pedir más profundidad (dolor, KPIs, TO-BE, restricciones) |
| Producto | Redactar `Docs/01–15`: épica, OKR, KPIs, alcance | Elegir los KPIs y corregir una meta inconsistente (el análisis de equilibrio mostró que un 1 % de error daba un neto negativo) |
| Revisión externa | Contrastar la documentación con dos evaluaciones simuladas (profesional y comité) | Decidir qué ajustar: sólo el contrato JSON de salida y el track |
| Contrato | Escribir `DisruptionAssessment` v1.0 con 10 invariantes y el fixture del caso base | Aprobar el contrato antes del código |
| BDD | Escribir el `.feature` (caso base, conflicto de fuentes, sin eventos, 404, datos personales) | Aprobarlo como gate: sin `.feature` aprobado no hay código |
| Código y tests | Implementar `engine/` y sus tests | Aprobar el plan, el recorte por tiempo y revisar el resultado |
| Frontend | Plan (`Docs/18`), segundo `.feature`, pantalla en React y 67 tests entre motor y pantalla | Elegir el alcance (ver y aceptar), elegir React sobre HTML plano sabiendo el costo en tiempo, y aprobar el `.feature` antes del código |

## Decisiones que tomé yo
- **Track Backend/Integración**, TypeScript + Node, servicio HTTP (lo exige la entrega de `api_url`).
- **Sin IA en runtime** (ADR-009): la decisión es determinista y auditable. Un LLM no agrega valor donde la política ya define la regla, y suma riesgo de alucinación y de exponer datos personales.
- **P-17:** cada entitlement respeta su propia bandera de aprobación. Con un menor en el grupo, O1 se ofrece en automático (R3 no requiere aprobación) y R5 se deriva en paralelo. Es la lectura literal de la política y se puede cambiar desde la política sin tocar código.
- **Ante la duda, no afirmar:** dato en conflicto o ausente → `UNVERIFIED` y derivación, nunca "sin cambios".
- **Recorte por tiempo:** 3 reservas de demostración en lugar de 7. El resto de los caminos de falla quedó cubierto con tests unitarios.
- **Frontend en React**, aunque el agente señaló que costaba unos 20 minutos más y que Vite 8 es reciente: lo elegí por las pruebas automáticas de la interacción de aceptar la opción. Para evitar un conflicto de versiones, `web/` es un paquete aparte con su propio vitest.
- **La pantalla no decide nada:** lee el contrato y pinta. No muestra `policy_ref`, `decision_id` ni `data_quality`, y nunca escribe "confirmado": la solicitud queda pendiente.
- **Escrituras idempotentes antes de la pantalla:** el agente detectó que cada refresco habría creado un caso y una notificación nuevos, y se corrigió primero.

## Cómo validé lo que generó la IA
- La salida de `ABC123` se compara campo a campo con el fixture del contrato, que resolví antes de escribir código.
- Un test por escenario de cada `.feature`, con el mismo nombre del escenario.
- Los fixtures de la pantalla los genera el motor real, y un test del motor verifica que sigan siendo idénticos a la API.
- La interacción de la pantalla (confirmar, vencimiento, duplicado, errores) se prueba con jsdom. No se probó en un navegador real ni se construyó la imagen de Docker; ambas cosas están declaradas como limitaciones.
- Las 10 invariantes del contrato y la ausencia de datos personales se verifican en cada respuesta.
- Revisé que los descartes de O2 y O3 tengan exactamente los motivos que se deducen del enunciado.

## Lo que nunca le di a un modelo
- Datos reales de pasajeros. Sólo se usaron los datos de ejemplo del enunciado.
- Credenciales o tokens.
- El envío final del formulario de entrega lo hago yo.
