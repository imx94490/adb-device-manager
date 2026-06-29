/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-bg': '#0a0e17',
        'cyber-surface': '#111827',
        'cyber-border': '#1e3a5f',
        'cyber-accent': '#00d4ff',
        'cyber-green': '#00ff88',
        'cyber-purple': '#a855f7',
        'cyber-yellow': '#fbbf24',
        'cyber-red': '#ef4444',
        'cyber-blue': '#3b82f6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-border': 'glow-border 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5), 0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.5)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-border': {
          '0%, 100%': { borderColor: 'rgba(0, 212, 255, 0.5)' },
          '50%': { borderColor: 'rgba(0, 212, 255, 1)' },
        },
      },
    },
  },
  plugins: [],
}
