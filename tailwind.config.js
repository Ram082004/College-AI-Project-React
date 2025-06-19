/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          },
        }
      },
      backgroundSize: {
        'gradient-size': '400% 400%'
      },
      colors: {
        navy: {
          800: '#1a365d',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}