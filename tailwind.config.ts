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
        ink: "#2d2a26",
        mist: "#f5f1ea",
        rice: "#fbf8f2",
        line: "#d9d1c4",
        accent: "#85725c",
        pine: "#5e6651",
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
