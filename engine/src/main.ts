import { createApp } from './http/server.js';

const port = Number(process.env.PORT ?? 8080);
createApp().listen(port, () => {
  process.stdout.write(`${JSON.stringify({ level: 'info', msg: 'disruption-engine listening', port })}\n`);
});
