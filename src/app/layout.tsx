import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaúdeIA | Conectando você aos hospitais com o poder da IA",
  description:
    "Nossa plataforma usa inteligência artificial para integrar os hospitais da sua cidade, facilitando o acesso a atendimentos, exames, leitos e orientações médicas. Mais agilidade, menos burocracia e saúde para todos.",
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
    <html lang="pt-BR" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
