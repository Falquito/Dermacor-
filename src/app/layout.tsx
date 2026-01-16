import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Dermacor",
  description: "Dermacor Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Providers>
          <Header />
          <main className="max-w-7xl mx-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
