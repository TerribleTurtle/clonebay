export interface LeaderElectionCallbacks<T> {
  onBecomeMaster: () => void;
  onBecomeSlave: () => void;
  onDataUpdate: (data: T) => void;
}

export type ElectionMessage<T> =
  | { type: 'ELECTION_REQUEST'; tabId: string }
  | { type: 'ELECTION_RESPONSE'; tabId: string }
  | { type: 'HEARTBEAT'; tabId: string }
  | { type: 'DATA_UPDATE'; payload: T };
