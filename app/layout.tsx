import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Drops — Stoic Society",
  description: "Calendar of upcoming character drops and weekly rhythm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink-900 text-ink-100">{children}</body>
    </html>
  );
}
