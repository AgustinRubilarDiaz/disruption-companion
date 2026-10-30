# RN-06 · Datos personales y mínimo privilegio ✅ Dada

**Fuente:** enunciado §3 ("Deben protegerse los datos personales y aplicarse mínimo privilegio") y
Entregable 3 ("qué información nunca entregarías a un modelo").

## PII presente en los datos de ejemplo
`name`, `email`, `phone`, `document_id`, `age` (menor), `loyalty_tier`.

## Cómo se aplica
- PII fuera de logs y de trazas; usar `passenger_id` / `booking_id` como referencia.
- PII fuera de prompts a cualquier modelo de IA (runtime o desarrollo), salvo decisión explícita.
- La evidencia de `create_human_case` incluye sólo lo necesario para resolver el caso.
- Cada componente tiene acceso sólo a las tools que necesita (las de escritura, al mínimo).
- Los fixtures del enunciado son ficticios (`example.com`); no agregar datos reales.

## Abierto
- Qué datos se muestran al pasajero y con qué nivel de autenticación (H-02).
