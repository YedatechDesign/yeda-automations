import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kate's Tasks",
  description: "Список задач и их статус",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="theme-dark h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
