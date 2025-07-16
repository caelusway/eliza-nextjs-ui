import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
      },
    },
  },
  plugins: [],
} satisfies Config 