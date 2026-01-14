import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dermacor",
  description: "Dermacor Application",

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}