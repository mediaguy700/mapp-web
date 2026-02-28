import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.BLE_API_URL ?? 'https://rkali63t89.execute-api.us-east-2.amazonaws.com/Prod';
  const apiKey = env.BLE_API_KEY ?? 'MlzzVbn4og1AN93aBra5pa9OTKZs716j35uFuV1I';

  return {
    base: './',
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          login: 'login.html',
          qrScan: 'qr-scan.html',
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', apiKey);
            });
          },
        },
      },
    },
  };
});
