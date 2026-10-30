# language: es
@EP-01
Característica: Pantalla del pasajero ante una modificación de vuelo
  Como pasajero con un vuelo modificado
  quiero ver de un vistazo qué pasó, qué me implica y qué hacer
  para decidir rápido sin llamar al contact center.

  # La pantalla consume sólo DisruptionAssessment v1.0 (Docs/16). No calcula entitlements ni conexiones.
  # Reloj simulado (Docs/18 §2): la vigencia de la opción corre desde que carga la pantalla,
  # valid_until − evaluated_at (115 s en el caso base).
  # Se ejecuta como test del view model (función pura) y del servidor HTTP, sin navegador (Docs/18 §3).

  Antecedentes:
    Dado que la política vigente es "POL-DELAY-2026-03"
    Y que el reloj simulado marca "2026-09-15T11:02:40Z"

  @happy-path @HU-010
  Escenario: Caso base ABC123, la pantalla muestra alerta, impacto, opción y botón en ese orden
    Dado la evaluación de la reserva "ABC123"
    Cuando se arma la pantalla
    Entonces se muestra primero la alerta con el vuelo "LA500" y su nueva salida "17:10"
    Y luego el impacto: no llega a su conexión "LA2410" de las "19:05"
    Y luego el siguiente paso con la opción "LA2412" del "2026-09-16" a las "08:15" para 2 pasajeros
    Y existe el botón "Aceptar este cambio" con una vigencia de 115 segundos
    Y se muestra el aviso de que un agente lo contactará en 45 minutos
    Y se muestra la hora de actualización de los datos "10:48"

  @edge @humano @HU-010
  Escenario: DEMOCONF, sin estado confirmado la pantalla no afirma ningún retraso
    Dado la evaluación de la reserva "DEMOCONF"
    Cuando se arma la pantalla
    Entonces se muestra "No pudimos confirmar el estado de tu viaje"
    Y no existe el botón "Aceptar este cambio"
    Y no se menciona ningún retraso ni ninguna opción
    Y se muestra el siguiente paso: un agente lo contactará

  @edge @humano @HU-010
  Escenario: DEMONOEV, sin eventos la pantalla nunca dice que no hay cambios
    Dado la evaluación de la reserva "DEMONOEV"
    Cuando se arma la pantalla
    Entonces se muestra "No pudimos confirmar el estado de tu viaje"
    Y el texto no contiene "sin cambios"
    Y no existe el botón "Aceptar este cambio"

  @edge @HU-010
  Escenario: Una plantilla desconocida se muestra como texto genérico de contacto
    Dado una evaluación con el "template_id" "PLANTILLA_FUTURA_V9"
    Cuando se arma la pantalla
    Entonces se muestra el texto genérico de contacto
    Y no existe el botón "Aceptar este cambio"

  @seguridad @RN-06 @HU-010
  Esquema del escenario: La pantalla no muestra datos internos
    Dado la evaluación de la reserva "<reserva>"
    Cuando se arma la pantalla
    Entonces el texto mostrado no contiene "POL-DELAY-2026-03", "R3", "R5", "dec_", "data_quality" ni "confidence"
    Y el texto mostrado no contiene "O2" ni "O3"
    Y el número de caso sólo aparece como referencia

    Ejemplos:
      | reserva  |
      | ABC123   |
      | DEMOCONF |
      | DEMONOEV |

  @happy-path @HU-007
  Escenario: Aceptar pide confirmación y sin confirmar no se llama al backend
    Dado la pantalla del caso base con la opción "O1"
    Cuando el pasajero pulsa "Aceptar este cambio"
    Entonces se le pide confirmar la opción "LA2412" del "2026-09-16"
    Y no se envía ninguna solicitud hasta que confirme

  @happy-path @HU-007
  Escenario: Confirmar crea una solicitud pendiente, nunca confirmada
    Dado la pantalla del caso base con la opción "O1"
    Cuando el pasajero confirma la opción "O1"
    Entonces el backend responde 201 con "request_id" "RBK-88231" y estado "PENDING_CONFIRMATION"
    Y se muestra "solicitado, pendiente de confirmación"
    Y el texto no contiene la palabra "confirmado" como estado de la solicitud

  @error @HU-007
  Escenario: Aceptar dos veces crea una sola solicitud
    Dado la solicitud de la opción "O1" de "ABC123" ya creada con "request_id" "RBK-88231"
    Cuando el pasajero confirma otra vez la opción "O1"
    Entonces el backend responde 200 con el mismo "request_id" "RBK-88231"
    Y se usó la misma clave de idempotencia en ambas solicitudes
    Y se muestra "solicitado, pendiente de confirmación"

  @error @HU-007
  Escenario: Una opción que no es la recomendada se rechaza
    Cuando se solicita la opción "O2" de "ABC123"
    Entonces el backend responde 422 con el error "OPTION_NOT_RECOMMENDED"
    Y no se llama a "create_rebooking_request"

  @error @HU-007
  Escenario: La opción vence mientras la pantalla está abierta
    Dado la pantalla del caso base con la opción "O1"
    Cuando pasan 115 segundos
    Entonces el botón "Aceptar este cambio" queda desactivado
    Y se pide actualizar la pantalla

  @error @HU-007
  Escenario: Solicitar una opción vencida se rechaza
    Dado que el reloj simulado marca "2026-09-15T11:05:00Z"
    Cuando se solicita la opción "O1" de "ABC123"
    Entonces el backend responde 410 con el error "OPTION_EXPIRED"
    Y no se llama a "create_rebooking_request"

  @seguridad @HU-007
  Escenario: La clave de idempotencia es determinística
    Cuando se calcula la clave de la opción "O1" de "ABC123" con la política "POL-DELAY-2026-03" y 2 pasajeros
    Entonces la clave es la misma en cada cálculo
    Y cambia si cambia la reserva, la opción, la política o la cantidad de pasajeros

  @seguridad @HU-008
  Escenario: Refrescar la pantalla no repite escrituras
    Dado que se consultó la evaluación de "ABC123"
    Cuando se consulta la evaluación de "ABC123" una segunda vez
    Entonces se creó un solo caso humano "HC-4471"
    Y se envió una sola notificación
    Y ambas respuestas son iguales
