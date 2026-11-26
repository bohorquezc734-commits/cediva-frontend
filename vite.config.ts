// import react from '@vitejs/plugin-react'
// import { defineConfig } from 'vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:5001', // <-- Pon aquí el puerto real de tu API .NET 9
        changeOrigin: true,
        secure: false, // Permite el certificado de desarrollo de .NET
      },
    },
  },
});