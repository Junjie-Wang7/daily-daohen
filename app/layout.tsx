import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "每日道痕",
  description: "一个安静、克制、偏东方留白风格的每日自省日记应用。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
