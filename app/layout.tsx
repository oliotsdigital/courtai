import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Court AI — AI-Powered Court Speech-to-Document",
  description:
    "Lightweight legal speech-to-text dictation application for court proceedings and legal orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
