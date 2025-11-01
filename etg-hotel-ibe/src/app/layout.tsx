import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ============================================
// FONTS
// ============================================

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// ============================================
// METADATA - SEO OPTIMIZED
// ============================================

export const metadata: Metadata = {
  title: {
    default: "ETG Hotel IBE - Book 3M+ Hotels Worldwide",
    template: "%s | ETG Hotel IBE",
  },
  description:
    "Book from 3 million hotels worldwide with best price guarantee. Powered by RateHawk API with instant confirmation and 24/7 support.",
  keywords: [
    "hotel booking",
    "hotels",
    "accommodation",
    "travel",
    "RateHawk",
    "best price",
    "instant confirmation",
  ],
  authors: [{ name: "ETG Hotel IBE" }],
  creator: "ETG Hotel IBE",
  publisher: "ETG Hotel IBE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://etg-hotel-ibe.vercel.app",
    title: "ETG Hotel IBE - Book 3M+ Hotels Worldwide",
    description:
      "Book from 3 million hotels worldwide with best price guarantee.",
    siteName: "ETG Hotel IBE",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ETG Hotel IBE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ETG Hotel IBE - Book 3M+ Hotels Worldwide",
    description:
      "Book from 3 million hotels worldwide with best price guarantee.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// ============================================
// ROOT LAYOUT
// ============================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.ratehawk.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Main Content */}
        <div className="min-h-screen flex flex-col">
          {children}
        </div>

        {/* Analytics & Monitoring will be added here */}
      </body>
    </html>
  );
}
