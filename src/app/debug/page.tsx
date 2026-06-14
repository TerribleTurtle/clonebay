"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLogStore } from '../../store/useLogStore';

export default function DebugPage() {
  const logs = useLogStore((state) => state.logs);
  const clearLogs = useLogStore((state) => state.clearLogs);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch on client store
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-6 font-mono flex flex-col">
      <header className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-status-yellow hover:text-status-yellow/80 transition-colors uppercase tracking-wider text-sm border border-status-yellow/30 px-3 py-1"
          >
            {'< Return'}
          </Link>
          <h1 className="text-2xl text-eve-cryo font-display font-bold uppercase tracking-widest">
            Diagnostic Terminal
          </h1>
        </div>
        <button
          type="button"
          onClick={clearLogs}
          className="border border-status-red bg-status-red/10 text-status-red px-4 py-1 hover:bg-status-red/20 transition-colors uppercase text-xs tracking-wider"
        >
          Purge Logs
        </button>
      </header>

      <div className="flex-1 overflow-auto bg-zinc-950 border border-zinc-800 p-4 relative">
        {logs.length === 0 ? (
          <div className="text-zinc-600 animate-pulse text-sm">
            Listening for transmission...
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`text-xs flex gap-4 ${
                  log.level === 'error' ? 'text-status-red' :
                  log.level === 'warn' ? 'text-status-yellow' :
                  'text-zinc-400'
                }`}
              >
                <span className="shrink-0 opacity-50">
                  {new Date(log.timestamp).toISOString().substring(
                    11, // eslint-disable-line no-magic-numbers
                    23 // eslint-disable-line no-magic-numbers
                  )}
                </span>
                <span className={`shrink-0 w-16 uppercase font-bold ${
                  log.level === 'error' ? 'text-status-red' :
                  log.level === 'warn' ? 'text-status-yellow' :
                  'text-eve-cryo'
                }`}>
                  [{log.source}]
                </span>
                <span className="flex-1 break-all">
                  {log.message}
                  {log.data !== undefined && (
                    <span className="ml-2 opacity-60">
                      {JSON.stringify(log.data)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
