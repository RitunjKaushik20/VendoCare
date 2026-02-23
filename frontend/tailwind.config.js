/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F8B195', // Peach
        coral: '#F67280',
        rose: '#C06C84',
        mauve: '#6C5B7B',
        deepBlue: '#355C7D',
        light: '#E5EAF5',
        dark: '#494D5F',
        darkBg: '#3a3d4f',
        darker: '#2d2f3f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #8458B3, 0 0 10px #8458B3' },
          '100%': { boxShadow: '0 0 20px #8458B3, 0 0 30px #8458B3' },
        },
      },
    },
  },
  plugins: [],
}
