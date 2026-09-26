// Konfiguracja tylko dla środowiska Claude (proxy + certyfikat proxy). Nie commitowana (.local/ w .gitignore).
import { defineConfig } from '@playwright/test';
import base from '../playwright.config';

export default defineConfig({
  ...base,
  testDir: '../tests',
  use: {
    ...base.use,
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium',
      proxy: { server: process.env.HTTPS_PROXY! },
      args: ['--ignore-certificate-errors-spki-list=KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk='],
    },
  },
});
