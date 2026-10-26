/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e', // Primary background (near-black)
          900: '#0d1117', // Sidebar / Topbar / Deep panels
          850: '#131822', // Card background
          800: '#1a2230', // Elevated panels / hover states
          750: '#212b3d', // Card header / active states
          700: '#2d3a52', // Borders & dividers
          600: '#435574', // Muted borders
          500: '#64748b', // Subdued text
          400: '#94a3b8', // Muted text
          300: '#cbd5e1', // Body text
          200: '#e2e8f0', // Bright text
          100: '#f8fafc', // Primary white
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          glow: '#00e5ff',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        success: {
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'cyan-glow': '0 0 15px -3px rgba(6, 182, 212, 0.3)',
      }
    },
  },
  plugins: [],
}
