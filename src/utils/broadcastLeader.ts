/**
 * src/utils/broadcastLeader.ts
 *
 * Implements a Leader Election algorithm using the BroadcastChannel API.
 * Ensures only one tab (the Master) performs active background tasks like
 * API polling, while other tabs (Slaves) listen for updates.
 */

export interface LeaderElectionCallbacks<T> {
  onBecomeMaster: () => void;
  onBecomeSlave: () => void;
  onDataUpdate: (data: T) => void;
}

type ElectionMessage<T> =
  | { type: 'ELECTION_REQUEST'; tabId: string }
  | { type: 'ELECTION_RESPONSE'; tabId: string }
  | { type: 'HEARTBEAT'; tabId: string }
  | { type: 'DATA_UPDATE'; payload: T };

const HEARTBEAT_INTERVAL_MS = 1000;
const MASTER_TIMEOUT_DURATION_MS = 3000;
const ELECTION_TIMEOUT_DURATION_MS = 500;
const RANDOM_STRING_RADIX = 36;
const RANDOM_STRING_START_INDEX = 2;
const RANDOM_STRING_END_INDEX = 15;
const MAX_JITTER_MS = 200;
const YIELD_MULTIPLIER = 1.5;

export class BroadcastLeader<T> {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private state: 'INIT' | 'ELECTION' | 'SLAVE' | 'MASTER' = 'INIT';
  private callbacks: LeaderElectionCallbacks<T>;

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private masterTimeout: ReturnType<typeof setTimeout> | null = null;
  private electionTimeout: ReturnType<typeof setTimeout> | null = null;
  private jitterTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: LeaderElectionCallbacks<T>) {
    this.callbacks = callbacks;
    
    // crypto.randomUUID() requires a secure context. Fallback to Math.random if needed.
    this.tabId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(RANDOM_STRING_RADIX).substring(RANDOM_STRING_START_INDEX, RANDOM_STRING_END_INDEX);

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('eve_dash_election');
      this.channel.onmessage = this.handleMessage.bind(this);
      this.startElection();
    }
  }

  private handleMessage(event: MessageEvent<ElectionMessage<T>>) {
    const msg = event.data;

    if (msg.type !== 'DATA_UPDATE' && msg.tabId === this.tabId) {
      this.tabId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(RANDOM_STRING_RADIX).substring(RANDOM_STRING_START_INDEX, RANDOM_STRING_END_INDEX);
      this.startElection();
      return;
    }

    switch (msg.type) {
      case 'ELECTION_REQUEST':
        if (this.state === 'MASTER') {
          // Tell the requester that a master already exists
          this.channel?.postMessage({ type: 'ELECTION_RESPONSE', tabId: this.tabId });
        } else if (this.state === 'ELECTION' && msg.tabId > this.tabId) {
          // If both are electing, yield to the higher ID to avoid split-brain
          this.resetElectionTimeout();
        } else if (this.state === 'SLAVE') {
          if (this.jitterTimeout) clearTimeout(this.jitterTimeout);
          this.resetMasterTimeout();
        }
        break;

      case 'ELECTION_RESPONSE':
      case 'HEARTBEAT':
        if (this.state === 'MASTER') {
          if (msg.tabId > this.tabId) {
            // Conflict: two masters exist. Yield to the higher ID.
            this.becomeSlave();
          }
        } else {
          this.becomeSlave();
        }
        break;

      case 'DATA_UPDATE':
        if (this.state !== 'MASTER') {
          this.callbacks.onDataUpdate(msg.payload);
        }
        break;
    }
  }

  private startElection() {
    this.state = 'ELECTION';
    this.clearAllTimers();

    // Broadcast intent to become master
    this.channel?.postMessage({ type: 'ELECTION_REQUEST', tabId: this.tabId });

    this.electionTimeout = setTimeout(() => {
      this.becomeMaster();
    }, ELECTION_TIMEOUT_DURATION_MS);
  }

  private resetElectionTimeout() {
    if (this.electionTimeout) clearTimeout(this.electionTimeout);
    this.electionTimeout = setTimeout(() => {
      this.becomeMaster();
    }, ELECTION_TIMEOUT_DURATION_MS * YIELD_MULTIPLIER);
  }

  private becomeMaster() {
    const wasMaster = this.state === 'MASTER';
    this.state = 'MASTER';
    this.clearAllTimers();

    this.channel?.postMessage({ type: 'ELECTION_RESPONSE', tabId: this.tabId });

    this.heartbeatInterval = setInterval(() => {
      this.channel?.postMessage({ type: 'HEARTBEAT', tabId: this.tabId });
    }, HEARTBEAT_INTERVAL_MS);

    if (!wasMaster) {
      this.callbacks.onBecomeMaster();
    }
  }

  private becomeSlave() {
    const wasSlave = this.state === 'SLAVE';
    this.state = 'SLAVE';

    // Clear active loops, but setup the master watchdog timer
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.electionTimeout) clearTimeout(this.electionTimeout);
    if (this.jitterTimeout) clearTimeout(this.jitterTimeout);
    this.heartbeatInterval = null;
    this.electionTimeout = null;
    this.jitterTimeout = null;

    this.resetMasterTimeout();

    if (!wasSlave) {
      this.callbacks.onBecomeSlave();
    }
  }

  private resetMasterTimeout() {
    if (this.masterTimeout) clearTimeout(this.masterTimeout);

    this.masterTimeout = setTimeout(() => {
      this.masterTimeout = null;
      // Master is dead (heartbeats stopped), hold a new election
      // Add a small random jitter to prevent election storms
      const jitter = Math.floor(Math.random() * MAX_JITTER_MS);
      this.jitterTimeout = setTimeout(() => {
        this.jitterTimeout = null;
        this.startElection();
      }, jitter);
    }, MASTER_TIMEOUT_DURATION_MS);
  }

  private clearAllTimers() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.masterTimeout) clearTimeout(this.masterTimeout);
    if (this.electionTimeout) clearTimeout(this.electionTimeout);
    if (this.jitterTimeout) clearTimeout(this.jitterTimeout);

    this.heartbeatInterval = null;
    this.masterTimeout = null;
    this.electionTimeout = null;
    this.jitterTimeout = null;
  }

  public broadcastEsiUpdate(payload: T) {
    if (this.state !== 'MASTER') {
      console.error('BroadcastLeader: Attempted to broadcast data from a slave tab. Ignoring to prevent duplicate ESI requests.');
      return;
    }
    this.channel?.postMessage({ type: 'DATA_UPDATE', payload });
  }

  public terminate() {
    this.clearAllTimers();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export function initLeaderElection<T>(callbacks: LeaderElectionCallbacks<T>): BroadcastLeader<T> {
  return new BroadcastLeader<T>(callbacks);
}

