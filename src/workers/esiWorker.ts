import "../lib/zodCspConfig";
import { logger } from "../utils/logger";
import { handleWorkerMessage } from "./pollingLoop";

import { WorkerContext } from "./types";

const defaultWorkerContext: WorkerContext = {
  postMessage: (msg: unknown) => self.postMessage(msg),
  setTimeout: (cb: TimerHandler, ms: number) => self.setTimeout(cb, ms),
  clearTimeout: (id: number) => self.clearTimeout(id),
};

if (typeof self !== 'undefined') {
  self.onmessage = (event: MessageEvent) => {
    handleWorkerMessage(event, defaultWorkerContext).catch((err) => {
      logger.error("ESI Worker: Error handling message", err);
    });
  };
}

// Export for tests
export { handleWorkerMessage } from "./pollingLoop";
