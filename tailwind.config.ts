import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
        'geist-mono': ['Geist Mono', 'monospace'],
        'red-hat-mono': ['Red Hat Mono', 'monospace'],
        'acumin-pro': ['Acumin Pro', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '1.4'],
        sm: ['14px', '1.5'],
        base: ['15px', '1.6'],
        lg: ['18px', '1.5'],
        xl: ['20px', '1.4'],
        '2xl': ['24px', '1.4'],
        '3xl': ['32px', '1.4'],
        '4xl': ['40px', '1.4'],
        '5xl': ['48px', '1.4'],
        '6xl': ['56px', '1.4'],
        '7xl': ['64px', '1.4'],
      },
      colors: {
        brand: {
          DEFAULT: '#FF6E71',
          50: '#FFFDFD',
          100: '#FFE8E8',
          200: '#FFD1D2',
          300: '#FFB1B3',
          400: '#FF8A8D',
          500: '#FF6E71',
          600: '#FF5A5E',
          700: '#E55A5D',
          800: '#CC4E51',
          900: '#B34245',
          950: '#8A3336',
        },
        accent: {
          DEFAULT: '#E0F58F',
          yellow: '#E0F58F',
        },
      },
      borderColor: {
        DEFAULT: '#333333',
      },
    },
  },
  plugins: [],
} satisfies Config;
