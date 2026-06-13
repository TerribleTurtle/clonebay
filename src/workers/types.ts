export interface CharacterAuthToken {
  accessToken: string;
  refreshToken: string;
  characterName: string;
}

export interface WorkerContext {
  postMessage: (msg: unknown) => void;
  setTimeout: (cb: TimerHandler, ms: number) => number;
  clearTimeout: (id: number) => void;
}
