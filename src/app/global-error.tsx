"use client";

import { Geist, Geist_Mono, Rajdhani, JetBrains_Mono } from "next/font/google";
import { useEffect } from "react";
import { SystemErrorUI } from "../components/SystemErrorUI";
import { logger } from "../utils/logger";

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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    logger.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html 
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-eve-bg text-zinc-50">
        <main className="flex-1 w-full flex items-center justify-center p-4">
          <SystemErrorUI error={error} reset={reset} />
        </main>
      </body>
    </html>
  );
}
