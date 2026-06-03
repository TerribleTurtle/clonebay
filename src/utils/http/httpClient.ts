const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_NOT_MODIFIED = 304;

export interface HttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  context: {
    schema?: import('zod').ZodTypeAny;
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

export class HttpClient {
  private interceptors: HttpInterceptor[] = [];

  use(interceptor: HttpInterceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

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
        fetchOptions.body = JSON.stringify(currentReq.body);
      }

      const fetchResponse = await fetch(currentReq.url, fetchOptions);

      let data: T | null = null;
      if (fetchResponse.status !== HTTP_STATUS_NO_CONTENT && fetchResponse.status !== HTTP_STATUS_NOT_MODIFIED) {
        const text = await fetchResponse.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            // @ts-expect-error fallback if JSON parse fails
            data = text;
          }
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
