import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASC3ND — From Foundation to Forward Motion",
  description: "ASC3ND Collective progress, event delivery, ownership, and path forward.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
