import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5bbfc',
          400: '#8199f8',
          500: '#667eea',
          600: '#4c63d2',
          700: '#3c4fa9',
          800: '#344389',
          900: '#2e3a6e',
        },
      },
    },
  },
  plugins: [],
}
export default config

