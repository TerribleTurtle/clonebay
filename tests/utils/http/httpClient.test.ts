import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '../../../src/utils/http/httpClient';

describe('HttpClient', () => {
  it('should execute interceptors in order', async () => {
    const client = new HttpClient();
    const order: number[] = [];
    
    client.use(async (req, next) => {
      order.push(1);
      const res = await next(req);
      order.push(4);
      return res;
    });

    client.use(async (req, next) => {
      order.push(2);
      const res = await next(req);
      order.push(3);
      return res;
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve('{"ok": true}')
    });

    await client.request({ url: '/test', context: {} });
    expect(order).toEqual([1, 2, 3, 4]);
  });

  it('should parse JSON response', async () => {
    const client = new HttpClient();
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve('{"data": 123}')
    });

    const res = await client.request({ url: '/test', context: {} });
    expect(res.data).toEqual({ data: 123 });
    expect(res.status).toBe(200);
    expect(res.esiStatus).toBe('Green');
  });

  it('should throw an error when JSON fails', async () => {
    const client = new HttpClient();
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve('not-json')
    });

    await expect(client.request({ url: '/test', context: {} })).rejects.toThrow();
  });

  it('should handle no content', async () => {
    const client = new HttpClient();
    global.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      headers: new Headers(),
    });

    const res = await client.request({ url: '/test', context: {} });
    expect(res.data).toBeNull();
  });
});
