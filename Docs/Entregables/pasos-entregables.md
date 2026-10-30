Cuando hayas finalizado, estas son las instrucciones para enviárselo a LATAM:
 
1. Configura la petición con estos datos:
Método	POST
URL	https://advana-challenge-check-api-cr-k4hdbggvoq-uc.a.run.app/software-engineer
Header	Content-Type: application/json
Body	JSON (ver más abajo)
2. Body del mensaje (JSON). Reemplaza los valores del ejemplo por los reales:
{
  "name": "Juan Perez",
  "mail": "juan.perez@example.com",
  "github_url": "https://github.com/juanperez/se-challenge.git",
  "api_url": "https://juan-perez.api"
}
Qué significa cada campo:
name: nombre completo del candidato/a.
mail: el mismo correo con el que se postuló al proceso (no usar otro).
github_url: URL pública del repositorio en GitHub con la solución del challenge.
api_url: URL pública donde quedó desplegada y accesible la API del candidato/a (los revisores la consultarán directamente).
3. Envíala una sola vez. No reenvíes la petición aunque te parezca que algo falló — si necesitas corregir algo, contáctanos por Soporte DTH. (Esto me avisas, si llegas a tener problemas)
4. Verifica que la respuesta sea exactamente esta:
{
  "status": "OK",
  "detail": "your request was received"
}
Si recibe cualquier otra respuesta (error 4xx, 5xx, HTML, o un mensaje distinto), el challenge no fue recibido. En ese caso revisa que:
El método sea POST (no GET).
El header Content-Type: application/json esté presente.
El body sea JSON válido (sin comas finales sobrantes ni comillas tipográficas).
La URL no tenga espacios ni esté cortada.
