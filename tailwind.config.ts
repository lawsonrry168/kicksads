import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1117",
        bg2: "#161b27",
        bg3: "#1e2536",
        bg4: "#252d3f",
        border: "#2a3350",
        border2: "#3a4460",
        text: "#e2e8f0",
        text2: "#94a3b8",
        text3: "#64748b",
        purple: "#7c6fff",
        purple2: "#a78bfa",
        teal: "#14b8a6",
        teal2: "#5eead4",
        amber: "#f59e0b",
        coral: "#f97316",
        green: "#22c55e",
        red: "#ef4444",
        blue: "#3b82f6",
      },
      fontFamily: {
        mono: ["'SF Mono'", "'Fira Code'", "'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
