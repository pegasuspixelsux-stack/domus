import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { GridLines } from "@/components/ui/grid-lines";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Domus — Propiedades de Lujo en Punta del Este",
  description:
    "Domus selecciona propiedades de ocio e inversión en Punta del Este para quienes buscan calidad de vida y retorno seguro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div aria-hidden className="paper-noise" />
        <GridLines />
        {children}
      </body>
    </html>
  );
}
