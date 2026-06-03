import { describe, it, expect } from 'vitest';
import { EsiMarketOrderSchema } from '../src/schemas/esi';

describe('ESI Schema Validation', () => {
  describe('EsiMarketOrderSchema', () => {
    it('should correctly parse a valid market order payload', () => {
      const validPayload = {
        duration: 30,
        escrow: 45.6,
        is_buy_order: true,
        is_corporation: false,
        issued: "2016-09-03T05:12:25Z",
        location_id: 60003760,
        min_volume: 1,
        order_id: 123456789,
        price: 33.3,
        range: "station",
        region_id: 10000002,
        type_id: 34,
        volume_remain: 4422,
        volume_total: 123456
      };

      const result = EsiMarketOrderSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject a payload with unknown keys (strict mode)', () => {
      const invalidPayload = {
        duration: 30,
        is_corporation: false,
        issued: "2016-09-03T05:12:25Z",
        location_id: 60003760,
        order_id: 123456789,
        price: 33.3,
        range: "station",
        region_id: 10000002,
        type_id: 34,
        volume_remain: 4422,
        volume_total: 123456,
        unknown_hallucinated_key: "bad"
      };

      const result = EsiMarketOrderSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should parse a valid sell order missing optional buy fields', () => {
      const sellOrderPayload = {
        duration: 90,
        is_corporation: true,
        issued: "2016-09-03T05:12:25Z",
        location_id: 60003760,
        order_id: 987654321,
        price: 1000.5,
        range: "region",
        region_id: 10000002,
        type_id: 35,
        volume_remain: 10,
        volume_total: 10
      };

      const result = EsiMarketOrderSchema.safeParse(sellOrderPayload);
      expect(result.success).toBe(true);
    });
  });
});
