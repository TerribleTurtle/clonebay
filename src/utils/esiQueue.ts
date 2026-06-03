const MAX_CONCURRENT_REQUESTS = 5;

let activeRequests = 0;
const requestQueue: (() => void)[] = [];

export async function enqueueRequest(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    requestQueue.push(resolve);
  });
}

export function dequeueRequest(): void {
  if (requestQueue.length > 0) {
    const resolve = requestQueue.shift();
    if (resolve) resolve();
  } else {
    activeRequests--;
  }
}

export function resetQueueForTests(): void {
  activeRequests = 0;
  requestQueue.length = 0;
}
