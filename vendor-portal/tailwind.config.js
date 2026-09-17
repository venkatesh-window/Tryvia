/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: "#CB6D73", // Dusty Rose / Mauve Accent
          light: "#F8EFF0", // Soft Rose Tint
          dark: "#B05359", // Deep Rose
        },
        secondary: {
          main: "#232127", // Deep Charcoal / Luxury Black
          light: "#3A3740",
        },
        tertiary: {
          main: "#FFFFFF",
        },
        background: {
          default: "#FAF8F5", // Ultra-clean Warm Porcelain
          paper: "#FFFFFF",
          surface: "#F5F2EC",
          chip: "#F4F0EB",
        },
        text: {
          primary: "#1A1918", // Deep Charcoal
          secondary: "#8E8A85", // Warm Muted Grey
          accent: "#CB6D73", // Rose Accent
          dark: "#232127",
        },
        border: {
          glass: "rgba(255, 255, 255, 0.85)",
          light: "#ECE7E1",
          subtle: "#F0ECE6",
        },
        state: {
          error: "#E57373",
          success: "#81C784",
          warning: "#FFB74D",
        },
      },
      boxShadow: {
        glass: "0 4px 30px rgba(50, 40, 30, 0.06)",
        card: "0 2px 10px rgba(0, 0, 0, 0.05)",
        glow: "0 0 15px rgba(203, 109, 115, 0.2)",
      },
      fontFamily: {
        brand: ["Cormorant Garamond", "serif"],
        serif: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
