import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalAI | Intelligent Health starts with AI",
  description:
    "Get real-time wellness insights, personalized recommendations, and full control over your health metrics with our advanced AI platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="antialiased min-h-screen transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
