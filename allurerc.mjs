import { defineConfig } from 'allure';

export default defineConfig({
  name: 'KIS List – powiadomienia o komentarzach',
  output: './allure-report',
  plugins: {
    awesome: { options: { singleFile: true, reportLanguage: 'pl', groupBy: ['epic', 'feature', 'story'] } },
  },
});
