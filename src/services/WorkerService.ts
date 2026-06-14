import { WorkerManager } from '../workers/WorkerManager';

export class WorkerService {
  /**
   * Returns the singleton WorkerManager instance, lazily initializing
   * the background ESI worker if it hasn't been created yet.
   */
  static getManager(): WorkerManager {
    return WorkerManager.getInstance(() => new Worker(new URL('../workers/esiWorker.ts', import.meta.url)));
  }
}
