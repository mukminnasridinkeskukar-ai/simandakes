import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/simandakes/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIMANDAKES — Sistem Informasi dan Manajemen SDM Kesehatan",
  description:
    "Platform digital terintegrasi untuk mengelola informasi tenaga kesehatan di Indonesia. Cari praktisi kesehatan terpercaya dan kelola data SDM Kesehatan dengan efisien.",
  keywords: [
    "SIMANDAKES",
    "SDM Kesehatan",
    "tenaga kesehatan",
    "dokter",
    "bidan",
    "perawat",
    "apoteker",
    "Dinas Kesehatan",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SIMANDAKES — Sistem Informasi dan Manajemen SDM Kesehatan",
    description:
      "Platform digital terintegrasi untuk mengelola informasi tenaga kesehatan di Indonesia.",
    siteName: "SIMANDAKES",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
