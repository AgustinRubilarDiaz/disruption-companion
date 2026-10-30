# language: es
@EP-01
Característica: Evaluación de la disrupción de una reserva
  Como pasajero con un vuelo modificado
  quiero recibir el estado real de mi viaje, lo que me corresponde y un único siguiente paso
  para no tener que llamar al contact center.

  # Reloj fijo por escenario (decisión 4 del documento 17): la respuesta lo declara en X-Simulated-Clock.
  # Política: POL-DELAY-2026-03. Datos: brain/contracts/fixtures/.

  Antecedentes:
    Dado que la política vigente es "POL-DELAY-2026-03"
    Y que el reloj simulado marca "2026-09-15T11:02:40Z"

  @happy-path @HU-001 @HU-002 @HU-003 @HU-004 @HU-005 @HU-006
  Escenario: Caso base ABC123, retraso con conexión perdida y un menor en el grupo
    Dado la reserva "ABC123" con los datos del enunciado
    Cuando consulto la evaluación de la reserva
    Entonces la respuesta tiene código 200
    Y la respuesta es igual al fixture "disruption_assessment_ABC123.json"
    Y el segmento "S1" queda "DELAYED" con 160 minutos de retraso
    Y el evento "E-1012" de "LEGACY_MIRROR" se descarta por fuente degradada
    Y la conexión de "S1" a "S2" figura como perdida
    Y según POL-DELAY-2026-03/R3 se otorga "REBOOK_NO_FEE"
    Y según POL-DELAY-2026-03/R5 "PRIORITY_HANDLING" queda "PENDING_APPROVAL"
    Y la opción recomendada es "O1" y el siguiente paso es "ACCEPT_OPTION"
    Y se crea en paralelo una derivación "APPROVAL_REQUIRED" con el caso "HC-4471"
    Y las opciones "O2" y "O3" no aparecen en la respuesta
    Y el encabezado "X-Simulated-Clock" vale "2026-09-15T11:02:40Z"

  @edge @humano @HU-001 @HU-005
  Escenario: DEMOCONF, dos fuentes sanas se contradicen sobre el mismo vuelo
    Dado la reserva "DEMOCONF" donde "OPS_CORE" informa un retraso de "S1" y "AIRPORT_FEED" lo informa "ON_TIME", ambas sanas y frescas
    Cuando consulto la evaluación de la reserva
    Entonces la respuesta tiene código 200
    Y el estado del viaje es "UNVERIFIED"
    Y no hay opción recomendada y el siguiente paso es "WAIT_FOR_AGENT"
    Y hay una derivación "SOURCE_CONFLICT"
    Y el mensaje no afirma ningún retraso ni ninguna opción

  @edge @humano @HU-001 @HU-005
  Escenario: DEMONOEV, no hay eventos operacionales para los segmentos
    Dado la reserva "DEMONOEV" sin eventos operacionales
    Cuando consulto la evaluación de la reserva
    Entonces la respuesta tiene código 200
    Y el estado del viaje es "UNVERIFIED" y nunca "NO_CHANGE"
    Y no hay opción recomendada y el siguiente paso es "WAIT_FOR_AGENT"
    Y hay una derivación "INCOMPLETE_DATA"

  @error
  Escenario: Reserva inexistente
    Cuando consulto la evaluación de la reserva "NOEXISTE"
    Entonces la respuesta tiene código 404 con el error "BOOKING_NOT_FOUND"

  @seguridad @RN-06
  Esquema del escenario: Ninguna respuesta contiene datos personales ni rompe las invariantes
    Cuando consulto la evaluación de la reserva "<reserva>"
    Entonces la respuesta no contiene "name", "email", "phone", "document_id" ni "loyalty_tier"
    Y la respuesta cumple las invariantes 1 a 10 del contrato DisruptionAssessment v1.0
    Y el mensaje trae "policy_ref"

    Ejemplos:
      | reserva  |
      | ABC123   |
      | DEMOCONF |
      | DEMONOEV |
