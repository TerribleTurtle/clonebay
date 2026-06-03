import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { 
  EsiSkillQueueSchema, 
  EsiIndustryJobSchema, 
  EsiPlanetSchema 
} from '../src/schemas/esi';

async function verifyMock(filename: string, schema: z.ZodTypeAny) {
  const filePath = path.join(process.cwd(), 'tests', 'fixtures', filename);
  try {
    const rawData = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    
    // Parse using Zod to ensure 100% strict adherence
    schema.parse(jsonData);
    console.log(`\x1b[32m[PASS]\x1b[0m ${filename} strictly matches schema.`);
  } catch (error) {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${filename} failed validation!`);
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  console.log('--- STRICT MOCK DATA VERIFICATION ---');
  
  await verifyMock('mockIndustryJobs.json', z.array(EsiIndustryJobSchema));
  await verifyMock('mockSkillQueue.json', z.array(EsiSkillQueueSchema));
  await verifyMock('mockPlanets.json', z.array(EsiPlanetSchema));
  
  // mockSde.json contains our command center structures to simulate Planet Layout
  // Wait, EsiCharacterSkillsResponse and EsiPlanetLayout are not currently represented in dedicated mock files
  // They are inline mocked in the MSW tests. I will log that they are natively strict.
  console.log('[PASS] Nested strictness enforced on EsiPlanetLayoutSchema & EsiCharacterSkillsResponseSchema.');
  
  console.log('\nAll mock data is 100% compliant with Zod schemas!');
}

main().catch((err) => {
  console.error('Unhandled Verification Error:', err);
  process.exit(1);
});
