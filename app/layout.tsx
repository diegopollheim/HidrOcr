import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HidrOcr",
  description: "Registro de leituras de hidrômetro com previsão de consumo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
