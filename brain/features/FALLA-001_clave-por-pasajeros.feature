# language: es
@EP-01 @FALLA-001 @HU-007 @RN-03
Característica: La clave de idempotencia identifica la intención, incluidos los pasajeros
  Como operación de LATAM
  quiero que cada solicitud de cambio tenga una clave propia de su reserva, opción, política y pasajeros
  para que un reintento nunca duplique una solicitud y dos grupos distintos nunca compartan una.

  # RN-03: la clave es estable por intención. Fórmula: sha256(booking_id | option_id | policy_ref | passenger_ids ordenados).
  # passenger_id no es un dato personal (invariante 7) y sólo viaja dentro del hash.

  Antecedentes:
    Dado que la política vigente es "POL-DELAY-2026-03"
    Y que el reloj simulado marca "2026-09-15T11:02:40Z"

  @seguridad
  Escenario: Dos grupos del mismo tamaño en la misma reserva tienen claves distintas
    Cuando se calcula la clave de la opción "O1" de "ABC123" para los pasajeros "P1, P2"
    Y se calcula la clave de la opción "O1" de "ABC123" para los pasajeros "P1, P3"
    Entonces las dos claves son distintas
    # Hoy falla: la clave sólo usa la cantidad de pasajeros (2 en ambos casos).

  @seguridad
  Escenario: El orden de los pasajeros no cambia la clave
    Cuando se calcula la clave de la opción "O1" de "ABC123" para los pasajeros "P1, P2"
    Y se calcula la clave de la opción "O1" de "ABC123" para los pasajeros "P2, P1"
    Entonces las dos claves son iguales

  @seguridad
  Esquema del escenario: La clave cambia si cambia cualquier parte de la intención
    Cuando se calcula la clave de la opción "O1" de "ABC123" para los pasajeros "P1, P2" con la política "POL-DELAY-2026-03"
    Y se calcula la clave cambiando <parte> a "<valor>"
    Entonces las dos claves son distintas

    Ejemplos:
      | parte      | valor             |
      | la reserva | XYZ789            |
      | la opción  | O2                |
      | la política | POL-DELAY-2026-04 |
      | los pasajeros | P1               |

  @happy-path
  Escenario: La solicitud del caso base usa la clave de sus pasajeros
    Cuando se solicita la opción "O1" de "ABC123"
    Entonces "create_rebooking_request" recibe la clave de "ABC123", "O1", "POL-DELAY-2026-03" y los pasajeros "P1, P2"

  @error
  Escenario: Los reintentos ante un 503 siguen usando la misma clave
    Dado que "create_rebooking_request" responde 503 "UPSTREAM_TIMEOUT" en todos los intentos
    Cuando se solicita la opción "O1" de "ABC123"
    Entonces se intenta 3 veces con la misma clave
    Y el backend responde 202 con estado "CONFIRMING"
    Y se deriva con "REBOOKING_INDETERMINATE"
