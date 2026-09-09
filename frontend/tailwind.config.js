/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          dark: 'var(--bg-secondary)', 
          darker: 'var(--bg-primary)', 
          gold: 'var(--gold-primary)', 
          goldLight: 'var(--gold-secondary)',
          goldDark: 'var(--gold-tertiary)',
          card: 'var(--card-bg)',
          border: 'var(--border-color)',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
