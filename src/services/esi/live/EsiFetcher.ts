import { fetchEsi, type EsiResponse } from "../esiClient";
import { z } from "zod";
import { logger } from "../../../utils/logger";

export class EsiFetcher {
    public safeFetch<T>(url: string, accessToken: string, characterId: string, schema: z.ZodType<T>, name: string, method?: string, body?: unknown): Promise<EsiResponse<T> | null> {
        const fetchOptions: import('../esiClient').EsiRequestOptions<T> = { url, accessToken, characterId, schema };
        if (method !== undefined) fetchOptions.method = method;
        if (body !== undefined) fetchOptions.body = body;
        return fetchEsi<T>(fetchOptions).catch(error => {
          if (error instanceof z.ZodError) {
            logger.error(`ESI Worker: Contract Validation Error fetching ${name} for ${characterId}`, error);
          } else if (error instanceof TypeError) {
            logger.error(`ESI Worker: Network Error fetching ${name} for ${characterId}`, error.message);
          } else {
            logger.error(`ESI Worker: Error fetching ${name} for ${characterId}`, error);
          }
          throw error;
        });
    }
}
