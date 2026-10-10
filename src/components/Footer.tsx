import React from 'react';
import Link from 'next/link';
import { CCP_LEGAL_NOTICE, REPO_URL, UNOFFICIAL_NOTICE } from '../config/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-800 bg-eve-panel font-mono text-xs text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-4">
          <p className="text-zinc-300 tracking-wider">
            {UNOFFICIAL_NOTICE}
          </p>
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-4 text-xs font-bold tracking-widest uppercase">
            <Link
              href="/privacy"
              className="text-zinc-400 hover:text-status-cyan transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan"
            >
              [ PRIVACY ]
            </Link>
            <Link
              href="/trust"
              className="text-zinc-400 hover:text-status-green transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-green"
            >
              [ TRUST & LEGAL ]
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-status-yellow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-yellow"
            >
              [ GITHUB ]
            </a>
          </nav>
        </div>

        <details className="text-[11px] text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-400 uppercase tracking-wider select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600">
            CCP Games Trademark & IP Notice
          </summary>
          <p className="mt-2 text-zinc-500 uppercase leading-relaxed border-l border-zinc-700 pl-3">
            {CCP_LEGAL_NOTICE}
          </p>
        </details>
      </div>
    </footer>
  );
};
