"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { logger } from "@/utils/logger";

import { AuthService } from "@/services/AuthService";

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      await AuthService.handleCallback(code, state);
      router.push("/");
    }

    processCallback().catch((err) => {
      logger.error("SSO Callback Critical Error", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-status-red">
        <h1 className="mb-4 text-2xl font-bold">Authentication Failed</h1>
        <p className="max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center font-mono">
      <div className="mb-4 h-8 w-8 animate-spin rounded-none border-t-2 border-l-2 border-status-cyan"></div>
      <p className="uppercase tracking-widest text-sm text-status-cyan">Verifying Authorization Protocols...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><p>Loading...</p></div>}>
      <CallbackLogic />
    </Suspense>
  );
}
