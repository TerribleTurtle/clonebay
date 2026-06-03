import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConsentBanner } from "../components/ConsentBanner";
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
  title: "EVE-Dash | Unified Multibox Command Center",
  description: "Eliminate alt-tab fatigue. A zero-backend, secure, and open-source dashboard for monitoring EVE Online skill queues, industry jobs, and planetary interaction across your entire fleet.",
  openGraph: {
    title: "EVE-Dash | Unified Multibox Command Center",
    description: "Eliminate alt-tab fatigue with this zero-backend EVE Online dashboard.",
    url: "https://eve-dash.example.com",
    siteName: "EVE-Dash",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVE-Dash | Unified Multibox Command Center",
    description: "Eliminate alt-tab fatigue with this zero-backend EVE Online dashboard.",
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
          content="default-src 'self'; connect-src 'self' https://esi.evetech.net https://login.eveonline.com; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        />
      </head>
      <body className="min-h-full flex flex-col bg-eve-bg text-zinc-50">
        <GlobalHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col">
          {children}
        </main>
        <ConsentBanner />
      </body>
    </html>
  );
}
