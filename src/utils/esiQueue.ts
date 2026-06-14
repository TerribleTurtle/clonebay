import { HttpInterceptor } from './http/httpClient';

const MAX_CONCURRENT_REQUESTS = 5;

export class EsiQueue {
  private activeRequests = 0;
  private requestQueue: (() => void)[] = [];

  async enqueueRequest(): Promise<void> {
    if (this.activeRequests < MAX_CONCURRENT_REQUESTS) {
      this.activeRequests++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.requestQueue.push(resolve);
    });
  }

  dequeueRequest(): void {
    if (this.requestQueue.length > 0) {
      const resolve = this.requestQueue.shift();
      if (resolve) resolve();
    } else {
      this.activeRequests--;
    }
  }

  createInterceptor(): HttpInterceptor {
    return async (req, next) => {
      await this.enqueueRequest();
      try {
        return await next(req);
      } finally {
        this.dequeueRequest();
      }
    };
  }

  resetForTests(): void {
    this.activeRequests = 0;
    this.requestQueue.length = 0;
  }
}

export const globalEsiQueue = new EsiQueue();
export const esiQueueInterceptor = globalEsiQueue.createInterceptor();

export function resetQueueForTests(): void {
  globalEsiQueue.resetForTests();
}
