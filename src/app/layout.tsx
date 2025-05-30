
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Bença, Pai.',
  description: 'Converta os Prints para PDF e envie-os por e-mail sem esforço.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Next.js adiciona <meta charSet="utf-8" /> automaticamente.
            Não é necessário adicionar manualmente aqui, a menos que haja um problema específico.
            A configuração correta da fonte é mais provável de resolver problemas de renderização de acentos.
        */}
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
