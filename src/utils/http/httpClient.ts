const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_NOT_MODIFIED = 304;

export interface HttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  context: {
    characterId?: string;
    accessToken?: string;
    retries?: number;
  };
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T | null;
  cached: boolean;
  esiStatus: 'Green' | 'Yellow' | 'Red' | 'Offline';
}

export type HttpNext = (req: HttpRequest) => Promise<HttpResponse>;
export type HttpInterceptor = (req: HttpRequest, next: HttpNext) => Promise<HttpResponse>;

/**
 * A flexible HTTP client that supports interceptors for request/response mutation.
 * 
 * @example
 * const client = new HttpClient();
 * client.use(async (req, next) => {
 *   req.headers = { ...req.headers, 'Authorization': 'Bearer token' };
 *   const response = await next(req);
 *   return response;
 * });
 * 
 * const response = await client.request<{ id: number }>({ url: '/api/data', context: {} });
 */
export class HttpClient {
  private interceptors: HttpInterceptor[] = [];

  /**
   * Registers an interceptor to be executed in the request pipeline.
   * Interceptors are executed in the order they are added.
   * 
   * @param interceptor - The interceptor function to add.
   * @returns The HttpClient instance for chaining.
   * 
   * @example
   * client.use(async (req, next) => {
   *   console.log('Request started:', req.url);
   *   return next(req);
   * });
   */
  use(interceptor: HttpInterceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

  /**
   * Executes an HTTP request through the interceptor pipeline.
   * 
   * @template T - The expected type of the response data.
   * @param req - The request configuration object.
   * @returns A promise resolving to the HTTP response containing the typed data.
   * 
   * @example
   * const response = await client.request<{ status: string }>({
   *   url: 'https://esi.evetech.net/latest/status/',
   *   method: 'GET',
   *   context: {}
   * });
   * console.log(response.data?.status);
   */
  async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
    let index = 0;
    
    const next: HttpNext = async (currentReq: HttpRequest): Promise<HttpResponse> => {
      if (index < this.interceptors.length) {
        const interceptor = this.interceptors[index];
        index++;
        if (!interceptor) {
          throw new Error("Interceptor is undefined");
        }
        return interceptor(currentReq, next);
      }
      
      const fetchOptions: RequestInit = {
        method: currentReq.method || 'GET',
      };
      
      if (currentReq.headers) {
        fetchOptions.headers = currentReq.headers;
      }

      if (currentReq.body !== undefined) {
        if (typeof currentReq.body === 'string' || currentReq.body instanceof URLSearchParams) {
          fetchOptions.body = currentReq.body;
        } else {
          fetchOptions.body = JSON.stringify(currentReq.body);
        }
      }

      // eslint-disable-next-line no-restricted-globals
      const fetchResponse = await fetch(currentReq.url, fetchOptions);

      let data: T | null = null;
      if (fetchResponse.status !== HTTP_STATUS_NO_CONTENT && fetchResponse.status !== HTTP_STATUS_NOT_MODIFIED) {
        const text = await fetchResponse.text();
        if (text) {
          data = JSON.parse(text) as T;
        }
      }

      return {
        status: fetchResponse.status,
        headers: fetchResponse.headers,
        data,
        cached: false,
        esiStatus: fetchResponse.ok ? 'Green' : 'Red',
      };
    };

    return (await next(req)) as unknown as HttpResponse<T>;
  }
}
