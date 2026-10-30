# RN-04 · Nada no validado llega al pasajero ✅ Dada

**Fuente:** enunciado §1 ("sin entregar información no verificada") y §2 (`notify_passenger`).

## Qué dice
`notify_passenger(message)` no debe enviar información no validada.
- 202 → `{ notification_id, channel: "PUSH", status: "QUEUED" }`
- 422 → `{ error: "UNVALIDATED_CONTENT", detail: "falta policy_ref" }`

## Cómo se aplica
- Todo mensaje lleva `policy_ref` y se construye sólo con datos validados (RN-05).
- `QUEUED` no es "entregado": no afirmar al pasajero ni a operación que el mensaje llegó.
- Si el contenido es rechazado (422), el error es del productor del mensaje: no reintentar igual.

## Abierto
- Qué se considera "validado" además de `policy_ref` (H-03).
- Qué información puede mostrarse al pasajero y cuál no (H-02).
