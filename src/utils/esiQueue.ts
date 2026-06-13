import { HttpInterceptor } from './http/httpClient';

const MAX_CONCURRENT_REQUESTS = 5;

let activeRequests = 0;
const requestQueue: (() => void)[] = [];

async function enqueueRequest(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    requestQueue.push(resolve);
  });
}

function dequeueRequest(): void {
  if (requestQueue.length > 0) {
    const resolve = requestQueue.shift();
    if (resolve) resolve();
  } else {
    activeRequests--;
  }
}

export const esiQueueInterceptor: HttpInterceptor = async (req, next) => {
  await enqueueRequest();
  try {
    return await next(req);
  } finally {
    dequeueRequest();
  }
};

export function resetQueueForTests(): void {
  activeRequests = 0;
  requestQueue.length = 0;
}
