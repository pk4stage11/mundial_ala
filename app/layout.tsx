import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiniela Mundial 2026",
  description:
    "Predice la fase de grupos y las eliminatorias del Mundial 2026 y compite por aciertos.",
};

export const viewport: Viewport = {
  themeColor: "#0b3d2e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
