/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }

  module.exports = {
    theme: {
      extend: {
        colors: {
          ivory: '#FFFFF0',
        }
      }
    }
  }
  