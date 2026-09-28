import { defineConfig } from '@playwright/test';

const PORT = 5173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Las partidas completas del juego son largas: con más procesos en paralelo, en un portátil
  // algunas pruebas superan los 30 s por carga (no por fallos). En CI se puede subir.
  workers: process.env.CI ? undefined : 2,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'escritorio',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'movil',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
