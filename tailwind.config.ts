import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        court: {
          50: "#f0f4f9",
          100: "#dbe6f3",
          200: "#bcd2eb",
          300: "#8eb6df",
          400: "#5992ce",
          500: "#3574be",
          600: "#2459a3",
          700: "#1e4684",
          800: "#1c3c6d",
          900: "#1c345c",
          950: "#13213c",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
