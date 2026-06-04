interface SystemErrorUIProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function SystemErrorUI({ error, reset }: SystemErrorUIProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 font-sans w-full">
      <div
        className="bg-eve-tactical border border-status-red shadow-[inset_0_0_20px_rgba(255,0,0,0.1),0_0_15px_rgba(255,0,0,0.2)] p-6 max-w-2xl w-full relative"
        role="alert"
        aria-live="assertive"
        aria-describedby="error-message"
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-status-red" />

        <div className="flex flex-col gap-4 pl-4 md:pl-2">
          <div className="flex items-center gap-3 border-b border-status-red/30 pb-4">
            <div className="w-3 h-3 bg-status-red border border-status-red/50 rounded-none animate-pulse" />
            <h2 className="text-xl md:text-2xl font-bold text-status-red uppercase tracking-widest font-rajdhani m-0 drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">
              Critical Subsystem Failure
            </h2>
          </div>

          <div className="bg-eve-void p-4 border border-eve-border overflow-x-auto">
            <p
              id="error-message"
              className="text-zinc-300 font-mono text-sm break-words m-0"
            >
              {error.message ||
                "An unexpected error occurred in the subsystem."}
            </p>
            {error.digest && (
              <p className="text-zinc-500 font-mono text-xs mt-3 pt-2 border-t border-zinc-800 m-0 uppercase tracking-wider">
                Digest Hash: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end pt-4 gap-4">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto bg-transparent border border-status-red text-status-red px-8 py-3 font-rajdhani uppercase tracking-[0.2em] font-bold text-sm hover:bg-status-red/20 focus:outline-none focus:ring-0 focus:border-white transition-all shadow-[0_0_10px_rgba(255,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]"
            >
              Reboot Subsystem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
