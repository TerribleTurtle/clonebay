'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const GlobalHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-eve-panel border-b border-status-cyan/30 shadow-[0_4px_20px_rgba(34,211,238,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Side: Logo / Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-4 h-4 bg-status-cyan shadow-[0_0_10px_rgba(34,211,238,0.6)] rotate-45 group-hover:rotate-90 group-hover:bg-amber-400 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all duration-300"></div>
            <h1 className="font-mono font-bold tracking-[0.2em] text-zinc-100 uppercase text-lg flex items-center group-hover:text-amber-400 transition-colors">
              CLONE<span className="text-status-cyan group-hover:text-amber-400 transition-colors">_</span>BAY
            </h1>
          </Link>
        </div>

        {/* Right Side: Navigation & Tools */}
        <nav className="hidden md:flex items-center gap-4 font-mono text-xs font-bold tracking-widest uppercase">
          <Link href="/trust" className="text-zinc-400 hover:text-status-green border border-transparent hover:border-status-green/50 bg-transparent hover:bg-status-green/10 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-green px-3 py-1.5">
            [ TRUST & LEGAL ]
          </Link>
          <Link href="/settings" className="text-zinc-400 hover:text-status-cyan border border-transparent hover:border-status-cyan/50 bg-transparent hover:bg-status-cyan/10 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan px-3 py-1.5">
            [ SETTINGS ]
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 text-zinc-400 hover:text-status-cyan transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan active:scale-95"
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center space-y-8 md:hidden font-mono text-sm font-bold tracking-widest uppercase border-t border-status-cyan/20">
          <Link href="/trust" className="text-zinc-400 hover:text-status-green hover:bg-status-green/10 border border-transparent hover:border-status-green/50 transition-all text-xl px-8 py-4 w-3/4 text-center" onClick={() => setIsMobileMenuOpen(false)}>
            [ TRUST & LEGAL ]
          </Link>
          <Link href="/settings" className="text-zinc-400 hover:text-status-cyan hover:bg-status-cyan/10 border border-transparent hover:border-status-cyan/50 transition-all text-xl px-8 py-4 w-3/4 text-center" onClick={() => setIsMobileMenuOpen(false)}>
            [ SETTINGS ]
          </Link>
        </div>
      )}
    </header>
  );
};
