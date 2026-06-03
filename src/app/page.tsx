export default function ComingSoonPage() {
  return (
    <main role="main" className="min-h-screen bg-[hsl(var(--eve-bg))] flex flex-col items-center justify-center p-6">
      {/* 
        NeoCom Panel 
        Strict geometry: rounded-none bans default rounded corners.
        High contrast borders with a glowing yellow status trim.
      */}
      <section 
        className="w-full max-w-2xl bg-[hsl(var(--eve-panel))] border border-[hsl(var(--eve-border))] border-l-4 border-l-[hsl(var(--status-yellow))] rounded-none p-8 flex flex-col items-center justify-center space-y-4"
      >
        {/*
          Glowing Header
          drop-shadow generates the EVE holographic bloom effect.
        */}
        <h1 
          role="status" 
          aria-live="polite"
          className="font-mono text-[hsl(var(--status-yellow))] uppercase tracking-widest text-3xl md:text-4xl drop-shadow-[0_0_8px_hsla(var(--status-yellow),0.6)]"
        >
          Coming Soon
        </h1>
        
        <p className="font-sans text-zinc-400 text-sm md:text-base tracking-wide text-center">
          INITIALIZING MULTIBOX COMMAND CENTER...
        </p>

        {/* Decorative Tech Lines (aria-hidden) */}
        <div aria-hidden="true" className="w-full flex justify-between items-center mt-8 pt-4 border-t border-[hsl(var(--eve-border))]">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[hsl(var(--status-yellow))] opacity-80" />
            <div className="w-2 h-2 bg-[hsl(var(--eve-border))]" />
            <div className="w-2 h-2 bg-[hsl(var(--eve-border))]" />
          </div>
          <span className="font-mono text-[hsl(var(--eve-border))] text-xs">SYS_ID: 0x8F9A2</span>
        </div>
      </section>
    </main>
  );
}
