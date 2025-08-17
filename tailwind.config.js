/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slideInFromLeft': 'slideInFromLeft 0.8s ease-out 0.3s both',
      },
      keyframes: {
        slideInFromLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-100px) translateY(-50%)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0) translateY(-50%)',
          }
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        'mono': ['Orbitron', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
