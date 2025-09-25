import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareLink",
  description: "CareLink Application",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
    other: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        sizes: '256x256',
        url: '/favicon.ico',
      },
    ],
  },
};

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