import { defineConfig } from 'allure';

export default defineConfig({
  name: 'KIS List – powiadomienia o komentarzach',
  output: './allure-report',
  plugins: {
    awesome: { options: { singleFile: false, reportLanguage: 'en', groupBy: ['epic', 'feature', 'story'] } },
  },
});
