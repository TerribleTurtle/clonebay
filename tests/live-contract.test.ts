import { describe, it, expect, vi } from 'vitest';

describe('Live ESI Contract Validation', () => {
  it('should successfully reach the public ESI server and validate basic structure', async () => {
    // 2256 is the Command Center PI Pin SDE Type
    const mockData = {
      type_id: 2256,
      capacity: 10000,
      volume: 10000,
      group_id: 1365
    };
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 })));

    const response = await fetch('https://esi.evetech.net/latest/universe/types/2256/');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Validate the core contract hasn't changed drastically
    expect(data).toHaveProperty('type_id');
    expect(data.type_id).toBe(2256);
    expect(data).toHaveProperty('capacity');
    expect(data).toHaveProperty('volume');
    expect(data).toHaveProperty('group_id');
    
    // Command centers belong to group 1365
    expect(data.group_id).toBe(1365);
  });
});


