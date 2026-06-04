'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const GlobalHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-eve-panel border-b border-eve-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Side: Logo / Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-4 h-4 bg-status-cyan shadow-[0_0_8px_rgba(34,211,238,0.4)] rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
            <h1 className="font-mono font-bold tracking-widest text-zinc-50 uppercase text-lg flex items-center gap-1">
              CLONE BAY <span className="text-eve-cryo font-normal">||</span> Command Center
            </h1>
          </Link>
        </div>

        {/* Right Side: Navigation & Tools */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-bold tracking-widest uppercase">
          <Link href="/settings" className="text-zinc-400 hover:text-status-cyan transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-2 py-1">
            [ SETTINGS ]
          </Link>
          <Link href="/trust" className="text-zinc-400 hover:text-status-green transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-2 py-1">
            [ TRUST & LEGAL ]
          </Link>
          <Link href="/debug" className="text-zinc-500 hover:text-status-yellow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-2 py-1">
            [ DEBUG TERMINAL ]
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 text-zinc-400 hover:text-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Full-Screen Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-eve-void/90 backdrop-blur-md flex flex-col items-center justify-center space-y-8 md:hidden font-mono text-sm font-bold tracking-widest uppercase">
          <button
            className="absolute top-4 right-4 sm:right-6 w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close mobile menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Link href="/settings" className="text-zinc-400 hover:text-status-cyan transition-colors text-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
            [ SETTINGS ]
          </Link>
          <Link href="/trust" className="text-zinc-400 hover:text-status-green transition-colors text-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
            [ TRUST & LEGAL ]
          </Link>
          <Link href="/debug" className="text-zinc-500 hover:text-status-yellow transition-colors text-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
            [ DEBUG TERMINAL ]
          </Link>
        </div>
      )}
    </header>
  );
};
