import { logger } from '../utils/logger';

type WorkerMessageHandler = (event: MessageEvent) => void;

export class WorkerManager {
  private static instance: WorkerManager;
  private worker: Worker | null = null;
  private messageHandlers: Set<WorkerMessageHandler> = new Set();
  
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private retryAttempt = 0;
  private isRunning = false;
  private isMockMode = false;

  /* eslint-disable no-magic-numbers */
  private readonly BASE_DELAY_MS = 1000;
  private readonly MAX_DELAY_MS = 60000;
  private readonly PING_INTERVAL_MS = 30000;
  private readonly PONG_TIMEOUT_MS = 5000;
  /* eslint-enable no-magic-numbers */

  private workerFactory: (() => Worker) | null = null;

  private constructor(factory?: () => Worker) {
    if (factory) {
      this.workerFactory = factory;
    }
  }

  public static getInstance(factory?: () => Worker): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager(factory);
    } else if (factory && !WorkerManager.instance.workerFactory) {
      WorkerManager.instance.workerFactory = factory;
    }
    return WorkerManager.instance;
  }

  /**
   * Subscribes a handler to receive messages from the worker.
   * 
   * @param {WorkerMessageHandler} handler - The function to handle incoming worker messages.
   * @returns {() => void} A cleanup function that removes the subscribed handler.
   */
  public subscribe(handler: WorkerMessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Starts the worker polling loop. 
   * If the worker is already running, this is a no-op.
   * 
   * @param {boolean} [isMockMode=false] - Whether to use mock ESI data instead of real ESI calls.
   */
  public start(isMockMode: boolean = false) {
    this.isMockMode = isMockMode;
    if (this.isRunning) return;
    this.isRunning = true;
    this.retryAttempt = 0;
    this.initWorker();
  }

  /**
   * Stops the worker and cleans up all timeouts/intervals.
   */
  public stop() {
    this.isRunning = false;
    this.cleanup();
  }

  private initWorker() {
    if (this.worker) {
      this.cleanup();
    }

    try {
      this.worker = this.workerFactory 
        ? this.workerFactory() 
        : new Worker(new URL('../workers/esiWorker.ts', import.meta.url));
      
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
      logger.error('WorkerManager: Failed to initialize worker', error);
      this.scheduleRestart();
      throw error;
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
    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  // Ping/Pong Architecture: Ensures the Web Worker hasn't silently died or locked up.
  // We send a PING periodically; if a PONG isn't returned within a timeout,
  // we assume the thread is stuck (e.g. frozen by the OS or a tight loop) and forcefully restart it.
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

    const EXPONENTIAL_BASE = 2;
    const backoff = Math.min(this.MAX_DELAY_MS, this.BASE_DELAY_MS * (EXPONENTIAL_BASE ** this.retryAttempt));
    
    // Jitter Math: We add up to 1 second of random jitter to the exponential backoff.
    // This prevents the "thundering herd" problem where multiple instances (e.g. multiboxers)
    // all restart and hammer the ESI API at the exact same moment.

    let jitter = Math.random() * 1000; // eslint-disable-line no-magic-numbers
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      jitter = (array[0] ?? 0) % 1000; // eslint-disable-line no-magic-numbers
    }
    const delay = backoff + jitter;
    
    this.retryAttempt++;
    
    logger.info(`WorkerManager: Restarting worker in ${Math.round(delay)}ms (Attempt ${this.retryAttempt})`);
    
    this.restartTimeout = setTimeout(() => {
      this.restartTimeout = null;
      if (this.isRunning) {
        this.initWorker();
      }
    }, delay);
  }
}




