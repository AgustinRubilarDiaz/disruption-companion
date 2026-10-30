# language: es
@UX-01
Característica: Pantalla moderna del pasajero (evolución UX-01)
  Como pasajero que mira su viaje desde el celular en el aeropuerto
  quiero entender mi situación de un vistazo y decidir con confianza
  para no tener que llamar ni hacer cuentas.

  # Evolución de producto (Docs/19 §19.4). Usa sólo campos de DisruptionAssessment v1.0:
  # no cambia el motor ni el contrato. Los escenarios de EP-01_pantalla-pasajero.feature siguen vigentes.
  # Ejecución: jsdom para la interacción; Playwright (navegador real) para lo marcado @visual.

  Antecedentes:
    Dado que el reloj simulado marca "2026-09-15T11:02:40Z"

  @modo-demo
  Escenario: El modo demo está separado de la vista del pasajero
    Cuando abro la pantalla
    Entonces veo una barra rotulada "Modo demo" con el selector de reserva y el reloj simulado
    Y la vista del pasajero no contiene el selector de reserva

  @modo-demo
  Escenario: Un enlace directo abre la reserva indicada
    Cuando abro la pantalla con "?booking=DEMOCONF"
    Entonces se muestra la evaluación de "DEMOCONF"
    Y al elegir "ABC123" en la barra de modo demo la dirección cambia a "?booking=ABC123"

  @modo-demo
  Escenario: Un enlace con una reserva desconocida no rompe la pantalla
    Cuando abro la pantalla con "?booking=NOEXISTE"
    Entonces se muestra la primera reserva de demostración

  @happy-path
  Escenario: La tarjeta principal resume el estado con ícono y texto
    Dado la evaluación de la reserva "ABC123"
    Cuando se arma la pantalla
    Entonces la tarjeta principal muestra "Tu vuelo LA500 sale ahora a las 17:10."
    Y la tarjeta tiene un ícono y un título que no dependen sólo del color

  @happy-path
  Escenario: La línea de tiempo muestra el itinerario y marca la conexión perdida
    Dado la evaluación de la reserva "ABC123"
    Cuando se arma la pantalla
    Entonces la línea de tiempo muestra el tramo "LA500" de "SCL" a "LIM"
    Y en ese tramo la salida programada "14:30" y la nueva "17:10" con "+160 min" y la puerta "24"
    Y muestra el tramo "LA2410" de "LIM" a "MEX" a las "19:05"
    Y entre ambos tramos se marca "Conexión perdida"

  @edge
  Escenario: Un tramo sin confirmar muestra sólo lo programado
    Dado la evaluación de la reserva "DEMOCONF"
    Cuando se arma la pantalla
    Entonces el tramo "LA500" se muestra como "Sin confirmar" con la salida programada "14:30"
    Y la línea de tiempo no muestra una hora nueva, ni minutos de retraso, ni "Conexión perdida"

  @happy-path
  Escenario: La comparación antes / ahora muestra qué cambia
    Dado la evaluación de la reserva "ABC123"
    Cuando se arma la pantalla
    Entonces la comparación muestra "Antes" el vuelo "LA2410" del "2026-09-15" a las "19:05"
    Y muestra "Ahora" el vuelo "LA2412" del "2026-09-16" a las "08:15"

  @edge
  Escenario: Sin opción no hay comparación
    Dado la evaluación de la reserva "DEMONOEV"
    Cuando se arma la pantalla
    Entonces no se muestra la comparación antes / ahora

  @accesibilidad @HU-007
  Escenario: La confirmación es un diálogo modal accesible
    Dado la pantalla de "ABC123"
    Cuando pulso "Aceptar este cambio"
    Entonces se abre un diálogo modal con el foco en "Sí, solicitar el cambio"
    Y el foco no sale del diálogo al recorrerlo con Tab
    Cuando presiono Escape
    Entonces el diálogo se cierra sin enviar la solicitud
    Y el foco vuelve a "Aceptar este cambio"

  @accesibilidad @HU-007
  Escenario: La barra de vigencia avisa antes de vencer
    Dado la pantalla de "ABC123"
    Entonces la barra de vigencia indica 115 de 115 segundos
    Cuando pasan 85 segundos
    Entonces se anuncia "Quedan 30 segundos para aceptar esta opción"
    Cuando pasan 30 segundos más
    Entonces se anuncia "La opción venció" y el botón queda desactivado

  @accesibilidad
  Escenario: Mientras carga se muestra un esqueleto
    Dado que la evaluación todavía no llegó
    Cuando abro la pantalla
    Entonces se muestra un esqueleto de carga marcado como ocupado

  @seguridad @RN-06
  Esquema del escenario: La pantalla nueva tampoco muestra datos internos
    Dado la evaluación de la reserva "<reserva>"
    Cuando se arma la pantalla
    Entonces el texto mostrado no contiene "POL-DELAY-2026-03", "R3", "R5", "dec_", "data_quality", "confidence", "O2" ni "O3"

    Ejemplos:
      | reserva  |
      | ABC123   |
      | DEMOCONF |
      | DEMONOEV |

  @visual
  Escenario: Recorrido real en el navegador
    Dado el servicio corriendo con la pantalla compilada
    Cuando abro "/?booking=ABC123" en Chromium con un viewport de celular
    Y acepto la opción y confirmo
    Entonces veo "pendiente de confirmación" y nunca "confirmado"
    Y se guardan capturas en celular, escritorio y modo oscuro

  @visual @accesibilidad
  Escenario: Con movimiento reducido no hay transiciones
    Dado el navegador con "prefers-reduced-motion: reduce"
    Cuando abro la pantalla
    Entonces las animaciones y transiciones duran 0 segundos
