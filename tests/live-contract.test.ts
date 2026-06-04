import { describe, it, expect } from 'vitest';

describe('Live ESI Contract Validation', () => {
  it('should successfully reach the public ESI server and validate basic structure', async () => {
    // 2256 is the Command Center PI Pin SDE Type
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


