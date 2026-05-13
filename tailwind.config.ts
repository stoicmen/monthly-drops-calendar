import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#08080a",
          800: "#101013",
          700: "#16161a",
          600: "#1d1d22",
          500: "#26262c",
          400: "#3a3a42",
          300: "#5a5a64",
          200: "#9a9aa4",
          100: "#dadae0",
        },
        accent: {
          mindset: "#7c5cff",
          physique: "#ff7a3d",
          surprise: "#ffd66b",
          prompt: "#4cd3a4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
