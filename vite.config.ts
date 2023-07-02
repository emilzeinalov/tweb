import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import handlebars from 'vite-plugin-handlebars';
import basicSsl from '@vitejs/plugin-basic-ssl';
import {visualizer} from 'rollup-plugin-visualizer';
import checker from 'vite-plugin-checker';
// import devtools from 'solid-devtools/vite'

const handlebarsPlugin = handlebars({
  context: {
    title: 'Telegram Web',
    description: 'Telegram is a cloud-based mobile and desktop messaging app with a focus on security and speed.',
    url: 'https://web.telegram.org/k/',
    origin: 'https://web.telegram.org/'
  }
});

const USE_HTTPS = false;

export default defineConfig({
  plugins: [
    // devtools({
    //   /* features options - all disabled by default */
    //   autoname: true // e.g. enable autoname
    // }),
    checker({
      typescript: true
    }),
    solidPlugin(),
    handlebarsPlugin as any,
    USE_HTTPS ? basicSsl() : undefined,
    visualizer({
      gzipSize: true,
      template: 'treemap'
    })
  ].filter(Boolean),
  server: {
    port: 8080,
    https: USE_HTTPS
  },
  base: '',
  build: {
    target: 'es2020',
    sourcemap: true,
    assetsDir: '',
    copyPublicDir: false,
    emptyOutDir: true
    // rollupOptions: {
    //   input: {
    //     main: './index.html',
    //     sw: './src/index.service.ts'
    //   }
    // }
    // cssCodeSplit: true
  },
  worker: {
    format: 'es'
  },
  css: {
    devSourcemap: true
  }
});
