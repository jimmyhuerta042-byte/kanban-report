import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Para GitHub Pages el sitio se sirve en https://<usuario>.github.io/<repo>/,
// así que las rutas de los assets deben colgar de "/<repo>/". Lo controlamos con
// la variable de entorno VITE_BASE (la define el workflow de despliegue).
// En local/dev el base es "/" para que todo funcione sin configurar nada.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  server: {
    host: '127.0.0.1',
  },
  plugins: [react()],
})
