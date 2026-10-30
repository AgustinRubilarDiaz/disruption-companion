# ADR-007 · Datos personales y trazabilidad

- **Estado:** Propuesto (implementado como supuesto de la POC; lo acepta el usuario)
- **Fecha:** 2026-10-30
- **Decide:** usuario (DS / Tech Lead, con legal / privacidad)
- **HU relacionada:** HU-001, HU-005, HU-006, HU-008 · **Hallazgo:** H-02 (sigue abierto con Diseño y legal)

## Contexto
`get_trip_context` trae nombre, email, teléfono y documento de cada pasajero. RN-06 exige proteger
los datos personales y aplicar mínimo privilegio, y RN-04 exige que cada mensaje se pueda trazar a una
política. Hay que decidir qué ve el pasajero, qué guarda el registro y qué nunca sale del adaptador.

## Opciones consideradas
### A. Pasar el contexto completo y filtrar en la pantalla
- A favor: la pantalla puede personalizar ("Hola, Ana").
- En contra: los datos personales viajan por la API y pueden terminar en logs; viola el mínimo privilegio.
### B. Los datos personales no salen del adaptador; la salida usa cantidades y seudónimos
- A favor: la garantía es estructural y se prueba con un test sobre cada respuesta.
- En contra: la pantalla no saluda por nombre.

## Decisión
**B.**
- **Respuesta (`DisruptionAssessment`):** el grupo es `passenger_count` + `includes_minor`. Nunca
  `name`, `email`, `phone`, `document_id` ni `loyalty_tier` (invariante 7, `domain/invariants.ts`).
- **Lo que ve el pasajero:** estado, horarios, lo que le corresponde, la opción y la hora del dato.
  No ve `policy_ref`, `rule_id`, `confidence`, fuentes internas ni `data_quality`.
- **Registro (`DecisionRecord`):** `booking_ref` es un seudónimo (`sha256` del `booking_id`, 6
  caracteres); guarda eventos, reglas y opciones descartadas, sin datos personales.
- **Logs:** sólo `decision_id`, `booking_ref`, estado y motivos.

Criterio que desempató: la privacidad se garantiza por construcción y se verifica con un test, en
vez de depender de que cada consumidor filtre bien.

## Consecuencias
- Positivas: el comité puede auditar cualquier decisión por `decision_id` sin ver datos personales.
- Negativas / costos asumidos: un seudónimo de 6 caracteres sobre un espacio chico de `booking_id` es
  reversible por fuerza bruta; en producción se usa un HMAC con secreto.
- Reversibilidad: alta para agregar campos de presentación; baja si un dato personal llega a un log.

## Evidencia
Esquema del escenario "Ninguna respuesta contiene datos personales ni rompe las invariantes" y
`engine/test/unit/orchestrator.test.ts` ("el registro de decisiones no contiene datos personales…").

## Pendiente
- Validar con Diseño y legal qué ve el pasajero (H-02).
