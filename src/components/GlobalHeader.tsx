'use client';

import React from 'react';
import Link from 'next/link';

export const GlobalHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-eve-panel border-b border-eve-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Side: Logo / Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-4 h-4 bg-status-cyan shadow-glow-cyan rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
            <h1 className="font-mono font-bold tracking-widest text-zinc-50 uppercase text-lg flex items-center gap-1">
              EVE-DASH <span className="text-zinc-500 font-normal">||</span> Command Center
            </h1>
          </Link>
        </div>

        {/* Right Side: Navigation & Tools */}
        <nav className="flex items-center gap-6 font-mono text-xs font-bold tracking-widest uppercase">
          <Link href="/settings" className="text-zinc-400 hover:text-cyan-400 transition-colors">
            [ SETTINGS ]
          </Link>
          <Link href="/trust" className="text-zinc-400 hover:text-emerald-400 transition-colors">
            [ OPSEC & TRUST ]
          </Link>
          <Link href="/debug" className="text-zinc-500 hover:text-amber-500 transition-colors">
            [ DEBUG TERMINAL ]
          </Link>
        </nav>
      </div>
    </header>
  );
};
