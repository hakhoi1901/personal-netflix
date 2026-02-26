
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google"; // Changed from Inter to Outfit - more cinematic/modern
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Providers from "@/components/Providers";

// Configure Outfit font
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HoriTime — Personal Cinema",
  description: "Your personal movie and series streaming platform",
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${outfit.variable} antialiased bg-zinc-950 text-white font-sans`} suppressHydrationWarning>
        <AuthProvider>
          <AuthGuard>
            <Providers>{children}</Providers>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
