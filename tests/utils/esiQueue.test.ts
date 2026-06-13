import { describe, it, expect, beforeEach } from 'vitest';
import { esiQueueInterceptor, resetQueueForTests } from '../../src/utils/esiQueue';
import { HttpRequest, HttpResponse } from '../../src/utils/http/httpClient';

describe('esiQueueInterceptor', () => {
  beforeEach(() => {
    resetQueueForTests();
  });

  const dummyReq = {} as HttpRequest;

  it('allows up to 5 concurrent requests without queueing', async () => {
    let active = 0;
    const nextMock = async () => {
      active++;
      return new Promise<HttpResponse>((resolve) => {
        setTimeout(() => resolve({ status: 200 } as unknown as HttpResponse), 10);
      });
    };

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(esiQueueInterceptor(dummyReq, nextMock));
    }
    
    await new Promise(r => setTimeout(r, 0));
    expect(active).toBe(5);
    await Promise.all(promises);
  });

  it('queues the 6th request until one finishes', async () => {
    const nextResolvers: Array<() => void> = [];
    let active = 0;
    const nextMock = async () => {
      active++;
      return new Promise<HttpResponse>((resolve) => {
        nextResolvers.push(() => resolve({ status: 200 } as unknown as HttpResponse));
      });
    };

    for (let i = 0; i < 5; i++) {
      esiQueueInterceptor(dummyReq, nextMock);
    }
    
    await new Promise(r => setTimeout(r, 0));
    expect(active).toBe(5);

    let sixthResolved = false;
    esiQueueInterceptor(dummyReq, nextMock).then(() => {
      sixthResolved = true;
    }).catch(() => {});

    await new Promise(r => setTimeout(r, 0));
    expect(active).toBe(5); // Still 5 active, 6th is queued
    expect(sixthResolved).toBe(false);

    // Complete the first one
    const resolver = nextResolvers[0];
    if (resolver) resolver();
    
    await new Promise(r => setTimeout(r, 5));
    expect(active).toBe(6); // Total times nextMock was called
  });
});
