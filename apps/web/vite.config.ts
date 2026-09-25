import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Preempaquetar al arrancar evita la recarga por "nuevas dependencias" en la primera
  // visita, que hacía fallar por timeout los E2E con el servidor en frío.
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react-router-dom',
      'zustand',
      'zustand/middleware',
      '@supabase/supabase-js',
    ],
  },
});
