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
        primary: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#59b0ff',
          500: '#338eff',
          600: '#1c6ef7',
          700: '#1559e3',
          800: '#1748b8',
          900: '#193f91',
          950: '#142858',
        },
        surface: {
          light: '#ffffff',
          dark: '#0f1117',
          card: {
            light: '#f8fafc',
            dark: '#1a1d28',
          },
          hover: {
            light: '#f1f5f9',
            dark: '#252836',
          }
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float-in': 'floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'number-tick': 'numberTick 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'breath': 'breath 3s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(51, 142, 255, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(51, 142, 255, 0.3)' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        numberTick: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breath: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(51, 142, 255, 0.2)' },
          '50%': { borderColor: 'rgba(51, 142, 255, 0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
