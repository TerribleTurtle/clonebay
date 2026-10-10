"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE_URL } from "../config/constants";
import { useDataWipe } from "../hooks/useDataWipe";
import { isLegacyHost, getWindowHostname } from "../utils/legacyHost";

interface LegacyDomainNoticeProps {
  children?: React.ReactNode;
}

export function LegacyDomainNotice({ children }: LegacyDomainNoticeProps) {
  const [isLegacy, setIsLegacy] = useState(false);
  const [isWiped, setIsWiped] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const pathname = usePathname() || "";
  const { handleWipeData } = useDataWipe();

  useEffect(() => {
    if (isLegacyHost(getWindowHostname())) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLegacy(true);
    }
  }, []);

  // When wrapping children in root layout, only render notice if on legacy host
  if (children !== undefined && !isLegacy) {
    return <>{children}</>;
  }

  const currentPath = pathname ? (pathname.startsWith("/") ? pathname : `/${pathname}`) : "";
  const destinationUrl = `${SITE_URL}${currentPath}`;

  const onWipeClick = async () => {
    setIsWiping(true);
    try {
      await handleWipeData(
        "Are you sure you want to wipe all local data on clonebay.app? This will remove all stored EVE SSO tokens and character settings from this browser."
      );
      setIsWiped(true);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center py-12 px-4 font-mono">
      <div className="w-full max-w-3xl bg-eve-tactical border border-status-cyan/50 p-6 sm:p-10 shadow-[0_0_30px_rgba(34,211,238,0.1)] relative">
        <div className="absolute top-0 left-0 w-2 h-full bg-status-cyan" />

        <div className="flex flex-col gap-2 mb-6 border-b border-eve-border pb-4">
          <div className="flex items-center gap-2 text-status-cyan text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-status-cyan animate-pulse" />
            Domain Migration Notice
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-widest uppercase text-eve-cryo">
            Clone Bay has moved
          </h1>
        </div>

        <div className="space-y-6 text-zinc-300 text-sm">
          <p className="leading-relaxed">
            Clone Bay has relocated to its permanent production domain at{" "}
            <span className="text-status-cyan font-bold">{SITE_URL}</span>.
          </p>

          <div className="pt-2 pb-2">
            <a
              href={destinationUrl}
              className="inline-flex items-center justify-center px-6 py-4 bg-status-cyan text-zinc-950 font-bold uppercase tracking-[0.2em] text-sm hover:bg-cyan-300 transition-colors border border-status-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan"
            >
              Proceed to {destinationUrl}
            </a>
          </div>

          <div className="bg-eve-void border border-eve-border p-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-status-yellow flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-status-yellow" />
              Authentication &amp; Storage Notice
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Because browser storage (IndexedDB and LocalStorage) is strictly isolated per domain,
              your EVE SSO tokens, cached fleet data, and character settings cannot carry over
              from the old site. You must log in again on the new site to re-authorize your characters.
            </p>
          </div>

          <div className="bg-eve-void border border-status-red/40 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-status-red flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-status-red" />
              Old Site Data Wipe
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To keep your browser clean, you can wipe all tokens and cache stored under clonebay.app:
            </p>

            {isWiped ? (
              <div className="p-3 bg-status-green/10 border border-status-green text-status-green font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-status-green" />
                <span>Browser data on this domain has been wiped successfully.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onWipeClick}
                disabled={isWiping}
                className="px-6 py-3 bg-transparent border border-status-red text-status-red hover:bg-status-red/20 transition-all uppercase tracking-widest font-bold text-xs disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-red"
              >
                {isWiping ? "Wiping Data..." : "Wipe this browser's data on the old site"}
              </button>
            )}
          </div>

          <div className="border-t border-eve-border pt-4">
            <p className="text-zinc-500 text-xs leading-relaxed">
              We also suggest revoking any old application grants at{" "}
              <a
                href="https://developers.eveonline.com/authorized-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-status-cyan underline hover:text-cyan-300 transition-colors"
              >
                https://developers.eveonline.com/authorized-apps
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
