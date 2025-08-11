import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { ZustandErrorBoundary } from "@/components/error/zustand-error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Perdami Store - Pre-order Oleh-oleh Khas Bandung",
  description: "Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Belanja online, ambil di venue event.",
  keywords: ["oleh-oleh Bandung", "PIT PERDAMI", "pre-order", "souvenir Bandung"],
  authors: [{ name: "Perdami Store Team" }],
  creator: "Perdami Store",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ZustandErrorBoundary>
              <MainLayout>
                {children}
              </MainLayout>
            </ZustandErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
