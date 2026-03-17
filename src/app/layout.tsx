import type { Metadata } from "next";
import { AppNavbar } from "@/components/app-navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "devroast",
  description: "Cole seu código e receba uma avaliação brutalmente honesta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="min-h-screen bg-background">
          <AppNavbar />
          {children}
        </div>
      </body>
    </html>
  );
}
