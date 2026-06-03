import { logger } from './logger';

type WorkerMessageHandler = (event: MessageEvent) => void;

export class WorkerManager {
  private static instance: WorkerManager;
  private worker: Worker | null = null;
  private messageHandlers: Set<WorkerMessageHandler> = new Set();
  
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private retryAttempt = 0;
  private isRunning = false;
  private isMockMode = false;

  /* eslint-disable no-magic-numbers */
  private readonly BASE_DELAY_MS = 1000;
  private readonly MAX_DELAY_MS = 60000;
  private readonly PING_INTERVAL_MS = 30000;
  private readonly PONG_TIMEOUT_MS = 5000;
  /* eslint-enable no-magic-numbers */

  private constructor() {}

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  public subscribe(handler: WorkerMessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public start(isMockMode: boolean = false) {
    this.isMockMode = isMockMode;
    if (this.isRunning) return;
    this.isRunning = true;
    this.retryAttempt = 0;
    this.initWorker();
  }

  public stop() {
    this.isRunning = false;
    this.cleanup();
  }

  private initWorker() {
    if (this.worker) {
      this.cleanup();
    }

    try {
      this.worker = new Worker(new URL('../workers/esiWorker.ts', import.meta.url));
      
      this.worker.onmessage = (event) => {
        if (event.data.type === 'PONG') {
          this.handlePong();
          return;
        }
        if (event.data.type === 'POLL_COMPLETE') {
          this.retryAttempt = 0;
        }
        
        // Dispatch to subscribers
        this.messageHandlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error('WorkerManager: Error in message handler', error);
            logger.error('WorkerManager: Error in message handler', error);
          }
        });
      };

      this.worker.onerror = (error) => {
        logger.error('WorkerManager: Worker crashed', error);
        this.scheduleRestart();
      };

      // Start the worker logic
      this.worker.postMessage({ type: 'START_POLLING', isMockMode: this.isMockMode });
      
      // Start ping/pong
      this.startPingPong();
    } catch (error) {
      console.error('WorkerManager: Failed to initialize worker', error);
      logger.error('WorkerManager: Failed to initialize worker', error);
      this.scheduleRestart();
    }
  }

  private cleanup() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout !== null) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private startPingPong() {
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.PING_INTERVAL_MS);
  }

  private sendPing() {
    if (!this.worker) return;
    
    this.worker.postMessage({ type: 'PING' });
    
    this.pongTimeout = setTimeout(() => {
      logger.error('WorkerManager: Missed PONG, terminating worker');
      this.scheduleRestart();
    }, this.PONG_TIMEOUT_MS);
  }

  private handlePong() {
    if (this.pongTimeout !== null) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private scheduleRestart() {
    this.cleanup();
    
    if (!this.isRunning) return;

    // eslint-disable-next-line no-magic-numbers
    const backoff = Math.min(this.MAX_DELAY_MS, this.BASE_DELAY_MS * (2 ** this.retryAttempt));
    // eslint-disable-next-line no-magic-numbers
    const jitter = Math.random() * 1000;
    const delay = backoff + jitter;
    
    this.retryAttempt++;
    
    logger.info(`WorkerManager: Restarting worker in ${Math.round(delay)}ms (Attempt ${this.retryAttempt})`);
    
    setTimeout(() => {
      if (this.isRunning) {
        this.initWorker();
      }
    }, delay);
  }
}
