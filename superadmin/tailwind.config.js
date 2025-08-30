/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'palette': {
          'yellow': '#F4E04D',
          'green': '#A4C962',
          'orange': '#FF7F00',
          'pink': '#FF1744',
          'beige': '#E8D5B7',
        }
      },
    },
  },
  plugins: [],
}
