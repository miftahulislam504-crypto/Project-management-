import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        civil: {
          bg:      '#f9fafb',   // page background — very light grey
          surface: '#f3f4f6',   // sidebar, secondary bg
          card:    '#ffffff',   // card/panel background
          border:  '#e5e7eb',   // all borders
          text:    '#111827',   // primary text — near black
          muted:   '#6b7280',   // secondary/muted text
          accent:  '#1a56db',   // primary blue (CivilOS brand)
          success: '#059669',   // green
          warning: '#d97706',   // amber
          danger:  '#dc2626',   // red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
