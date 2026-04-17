import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette
        maroon: {
          50:  '#fdf2f5',
          100: '#fce7ee',
          200: '#f9c9d8',
          300: '#f59cb5',
          400: '#ee6488',
          500: '#e23d65',
          600: '#cc2049',
          700: '#aa1539',
          800: '#9F1239', // PRIMARY
          900: '#7a1030',
          950: '#47071c',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F59E0B', // Saffron
          600: '#D97706', // Rich gold - ACCENT
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ivory: {
          50:  '#fffffe',
          100: '#F8F1E9', // bg-light
          200: '#F5EDE4', // bg-cream
          300: '#ede4d8',
          400: '#e0d5c5',
          500: '#cfc0a8',
        },
        rose: {
          desi: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'ivory-gradient': 'linear-gradient(135deg, #F8F1E9 0%, #F5EDE4 100%)',
        'maroon-gradient': 'linear-gradient(135deg, #9F1239 0%, #7a1030 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        'hero-gradient': 'linear-gradient(135deg, #F8F1E9 0%, #fce7ee 50%, #F5EDE4 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(217, 119, 6, 0.4)',
        'gold-glow-lg': '0 0 30px rgba(217, 119, 6, 0.5)',
        'maroon-glow': '0 0 15px rgba(159, 18, 57, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px rgba(159, 18, 57, 0.12)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.4s ease-out',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(217, 119, 6, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(217, 119, 6, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
