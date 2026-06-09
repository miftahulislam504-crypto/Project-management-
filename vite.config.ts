import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence deprecation warnings from third-party packages (frappe-gantt)
        quietDeps: true,
        // Use legacy API to avoid sass-embedded requirement
        api: 'legacy' as const,
      },
    },
  },
})
