"use client";

import { useEffect } from "react";
import { SystemErrorUI } from "../components/SystemErrorUI";
import { logger } from "../utils/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    logger.error("Route Segment Error:", error);
  }, [error]);

  return <SystemErrorUI error={error} reset={reset} />;
}
