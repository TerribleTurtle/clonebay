"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/AuthService";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initLogin() {
      try {
        await AuthService.startLogin();
      } catch (err) {
        logger.error("Failed to start login", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    
    initLogin();
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-status-red">
        <h1 className="mb-4 text-2xl font-display font-bold uppercase tracking-widest border-b border-status-red pb-2">Login Sequence Aborted</h1>
        <p className="max-w-md text-center font-mono text-sm mb-6">{error}</p>
        <Button 
          onClick={() => router.push('/')}
          variant="destructive"
          className="px-6 py-2 uppercase tracking-widest text-sm"
        >
          Return to Terminal
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center font-mono">
        <div className="mb-4 h-8 w-8 animate-spin rounded-none border-t-2 border-l-2 border-status-yellow"></div>
        <p className="uppercase tracking-widest text-sm text-status-yellow">Establishing Neural Link...</p>
      </div>
    </div>
  );
}
