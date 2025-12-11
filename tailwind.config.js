/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./app/components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        water: {
          blue: "#0077b6",
          light: "#90e0ef",
          white: "#ffffff",
          gray: "#f8f9fa"
        }
      },
      boxShadow: {
        soft: "0 4px 10px rgba(0,0,0,0.05)"
      },
      borderRadius: {
        xl: "1rem"
      }
    }
  },
  plugins: []
};
