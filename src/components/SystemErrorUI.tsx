

interface SystemErrorUIProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function SystemErrorUI({ error, reset }: SystemErrorUIProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 font-sans">
      <div className="bg-eve-panel border border-status-red shadow-glow-red p-6 max-w-2xl w-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-eve-border pb-4">
            <div className="w-3 h-3 bg-status-red rounded-none animate-pulse" />
            <h2 className="text-xl md:text-2xl font-semibold text-status-red uppercase tracking-wider font-rajdhani m-0">
              System Failure
            </h2>
          </div>
          
          <div className="bg-zinc-950 p-4 border border-eve-border overflow-x-auto">
            <p className="text-zinc-300 font-mono text-sm break-all m-0">
              {error.message || "An unexpected error occurred in the subsystem."}
            </p>
            {error.digest && (
              <p className="text-zinc-500 font-mono text-xs mt-2 m-0">
                Error Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => reset()}
              className="bg-zinc-900 border border-status-red text-status-red px-6 py-2 font-rajdhani uppercase tracking-widest text-sm hover:bg-status-red hover:text-zinc-950 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-status-red"
            >
              Reboot Subsystem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
