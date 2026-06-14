import type { EsiResponse } from "../esiClient";
import { mockFleet } from "../../../utils/mockFleet";
import { z } from "zod";

export class EsiMockFetcher {
    public getMockChar(charId: string) {
        return mockFleet.find(c => c.characterId === charId);
    }

    public mockResponse<T>(data: unknown, schema: z.ZodType<T>): Promise<EsiResponse<T> | null> {
        if (!data) return Promise.resolve(null);
        return Promise.resolve().then(() => schema.parseAsync(data)).then(parsed => ({ data: parsed, status: 'Green' as const, cached: false }));
    }
}
