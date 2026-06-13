import { describe, it, expect } from 'vitest';
import { EsiMarketOrderSchema, EsiSkillQueueSchema } from '../src/schemas/esi';
import { configSchema } from '../src/lib/schemas/configSchema';

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

  describe('EsiSkillQueueSchema', () => {
    it('should reject when start_date >= finish_date', () => {
      const invalid = {
        queue_position: 0,
        skill_id: 123,
        start_date: "2026-06-13T10:00:00Z",
        finish_date: "2026-06-13T10:00:00Z",
        level_start_sp: 0,
        training_start_sp: 0,
        level_end_sp: 250,
        finished_level: 1
      };
      const result = EsiSkillQueueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject when SP math is invalid (level_start_sp > training_start_sp)', () => {
      const invalid = {
        queue_position: 0,
        skill_id: 123,
        level_start_sp: 500,
        training_start_sp: 250,
        level_end_sp: 1000,
        finished_level: 2
      };
      const result = EsiSkillQueueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject when training_start_sp >= level_end_sp', () => {
      const invalid = {
        queue_position: 0,
        skill_id: 123,
        level_start_sp: 0,
        training_start_sp: 250,
        level_end_sp: 250,
        finished_level: 1
      };
      const result = EsiSkillQueueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject when finished_level === 1 but level_start_sp !== 0', () => {
      const invalid = {
        queue_position: 0,
        skill_id: 123,
        level_start_sp: 10,
        training_start_sp: 10,
        level_end_sp: 250,
        finished_level: 1
      };
      const result = EsiSkillQueueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('configSchema', () => {
    it('should reject if walletYellowThreshold <= walletRedThreshold', () => {
      const invalid = {
        walletYellowThreshold: 100,
        walletRedThreshold: 100
      };
      const result = configSchema.safeParse(invalid);
      expect(result.success).toBe(false);

      const invalid2 = {
        walletYellowThreshold: 50,
        walletRedThreshold: 100
      };
      const result2 = configSchema.safeParse(invalid2);
      expect(result2.success).toBe(false);
    });

    it('should parse valid config', () => {
      const valid = {
        walletYellowThreshold: 200,
        walletRedThreshold: 100
      };
      const result = configSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});


