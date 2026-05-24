/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        surface: '#080f0f',
        surface2: '#1c1c22',
        accent: '#10b981',
        accent2: '#34d399',
      },
      keyframes: {
        floatUp: {
          '0%':   { opacity: '0', transform: 'scale(0.4) translateY(0px) rotate(-8deg)' },
          '15%':  { opacity: '1', transform: 'scale(1.15) translateY(-20px) rotate(4deg)' },
          '30%':  { transform: 'scale(1.0) translateY(-40px) rotate(0deg)' },
          '70%':  { opacity: '1', transform: 'scale(1.0) translateY(-100px) rotate(-2deg)' },
          '100%': { opacity: '0', transform: 'scale(0.85) translateY(-180px) rotate(3deg)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.5', transform: 'scale(0.8)' },
        },
      },
      animation: {
        floatUp: 'floatUp 2.4s cubic-bezier(0.22,1,0.36,1) forwards',
        slideIn: 'slideIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        pulse:   'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
