import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        rice: "rgb(var(--rice) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        pine: "rgb(var(--pine) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
      },
      boxShadow: {
        quiet: "0 18px 40px rgba(86, 73, 53, 0.08)",
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at top, rgba(255,255,255,0.9), rgba(251,248,242,0.88) 42%, rgba(244,239,230,0.92) 100%)",
      },
      fontFamily: {
        serif: ["'Noto Serif SC'", "'Songti SC'", "'STSong'", "serif"],
        sans: ["'Noto Sans SC'", "'PingFang SC'", "'Microsoft YaHei'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
