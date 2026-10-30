import { defineConfig } from '@playwright/test';

const PORT = 8091;

// Usa el Google Chrome instalado (channel: 'chrome'): la descarga de Chromium de Playwright
// falla detrás de un proxy que intercepta TLS, y no se desactiva la verificación de certificados.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    locale: 'es-CL',
  },
  webServer: {
    // Compila la pantalla y el motor, y levanta un servidor limpio (el estado de las solicitudes vive en memoria).
    command: `npm run build && cd ../engine && npm run build && PORT=${PORT} node dist/main.js`,
    url: `http://127.0.0.1:${PORT}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
