import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cuidaê | Conectando você aos hospitais e postos de saúde",
  description:
    "O Cuidaê facilita seu acesso à saúde pública. Faça uma triagem rápida de sintomas e descubra se deve ir ao posto de saúde (UBS), UPA 24h ou hospital mais próximo.",
  icons: {
    icon: "/images/cuidae-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${inter.variable}`}>
      <body className="antialiased min-h-screen bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
