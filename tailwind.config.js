/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        tag: {
          tips: "#22c55e",
          updates: "#3b82f6", 
          news: "#f97316",
          design: "#8b5cf6",
          tutorial: "#ec4899",
        },
        primary: {
          DEFAULT: '#4F46E5',
          foreground: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}
