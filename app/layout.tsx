import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yeda — Automations Roadmap",
  description: "Track automation projects and progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
