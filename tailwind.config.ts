import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1118", panel: "#151b25", raised: "#1c2431", line: "#27324a",
        mute: "#8b97ad", text: "#e6ebf5", accent: "#7c8cff", gold: "#f2b84b",
      },
      fontFamily: { sans: ["var(--font-body)", "sans-serif"], display: ["var(--font-display)", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
