import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "每日道痕",
  description: "一个安静、克制、偏东方留白风格的每日自省日记应用。",
};

const themeBootstrap = `
(function () {
  try {
    var key = "daily-daohen-theme";
    var stored = localStorage.getItem(key);
    var preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    // Ignore theme bootstrap errors and fall back to the default stylesheet theme.
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
