import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Smart Home AI Platform",
  description:
    "Production-grade SaaS platform for smart-home automation, energy analytics and AI-driven recommendations.",
  authors: [{ name: "Abdulaziz AlAmawi" }],
  creator: "Abdulaziz AlAmawi",
  publisher: "Abdulaziz AlAmawi",
  applicationName: "Smart Home AI Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
