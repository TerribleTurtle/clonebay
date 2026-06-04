import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { GlobalHeader } from "../components/GlobalHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://clonebay.app"),
  title: "Clone Bay | Unified Multibox Command Center",
  description: "Eliminate alt-tab fatigue. A zero-backend, secure, and open-source dashboard for monitoring EVE Online skill queues, industry jobs, and planetary interaction across your entire fleet.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Clone Bay | Unified Multibox Command Center",
    description: "Eliminate alt-tab fatigue with this zero-backend EVE Online dashboard.",
    url: "https://clonebay.app",
    siteName: "Clone Bay",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clone Bay Command Center Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clone Bay | Unified Multibox Command Center",
    description: "Eliminate alt-tab fatigue with this zero-backend EVE Online dashboard.",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; connect-src 'self' https://esi.evetech.net https://login.eveonline.com; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.evetech.net data: blob:;"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Clone Bay",
              "description": "Unified Multibox Command Center for EVE Online.",
              "applicationCategory": "GameUtility",
              "operatingSystem": "All",
              "url": "https://clonebay.app"
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-eve-bg text-zinc-50">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-zinc-950 focus:text-cyan-400 focus:border-cyan-500 focus:border">
          Skip to main content
        </a>
        <GlobalHeader />
        <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col">
          {children}
        </main>

      </body>
    </html>
  );
}
