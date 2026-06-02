import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // 1. Enforce strict corners (No soft SaaS rounding)
    borderRadius: {
      none: "0px",
      sm: "2px",
    },
    // 2. Enforce strict glows (No soft drop shadows)
    boxShadow: {
      none: "0 0 #0000",
      "glow-cyan": "0 0 15px hsla(185, 100%, 50%, 0.3)",
      "glow-amber": "0 0 15px hsla(42, 96%, 63%, 0.3)",
      "glow-red": "0 0 15px hsla(5, 100%, 44%, 0.3)",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-rajdhani)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        eve: {
          bg: "hsl(var(--eve-bg))",
          panel: "hsl(var(--eve-panel))",
          border: "hsl(var(--eve-border))",
        },
        status: {
          green: "hsl(var(--status-green))",
          yellow: "hsl(var(--status-yellow))",
          red: "hsl(var(--status-red))",
          cyan: "hsl(var(--status-cyan))",
        },
        faction: {
          amarr: {
            DEFAULT: "hsl(var(--faction-amarr))",
            brass: "hsl(var(--faction-amarr-brass))",
          },
          caldari: {
            DEFAULT: "hsl(var(--faction-caldari))",
            blue: "hsl(var(--faction-caldari-blue))",
          },
          gallente: {
            DEFAULT: "hsl(var(--faction-gallente))",
            green: "hsl(var(--faction-gallente-green))",
          },
          minmatar: {
            DEFAULT: "hsl(var(--faction-minmatar))",
            red: "hsl(var(--faction-minmatar-red))",
          },
          triglavian: {
            DEFAULT: "hsl(var(--faction-triglavian))",
            bronze: "hsl(var(--faction-triglavian-bronze))",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
