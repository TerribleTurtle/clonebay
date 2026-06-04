import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { 
  EsiSkillQueueSchema, 
  EsiIndustryJobSchema, 
  EsiPlanetSchema,
  EsiCharacterSkillsResponseSchema,
  EsiClonesSchema,
  EsiFatigueSchema,
  EsiTransactionSchema,
  EsiShipSchema,
  EsiMailLabelsSchema,
  EsiContractSchema,
  EsiPlanetLayoutSchema,
  EsiSdeTypeSchema,
  EsiNotificationSchema,
  EsiWalletJournalEntrySchema
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
  
  await verifyMock('character_skills.json', EsiCharacterSkillsResponseSchema);
  await verifyMock('character_clones.json', EsiClonesSchema);
  await verifyMock('character_fatigue.json', EsiFatigueSchema);
  await verifyMock('character_transactions.json', z.array(EsiTransactionSchema));
  await verifyMock('character_ship.json', EsiShipSchema);
  await verifyMock('character_mail_labels.json', EsiMailLabelsSchema);
  await verifyMock('character_contracts.json', z.array(EsiContractSchema));
  await verifyMock('character_planet.json', EsiPlanetLayoutSchema);
  await verifyMock('universe_type.json', EsiSdeTypeSchema);
  await verifyMock('mockNotifications.json', z.array(EsiNotificationSchema));
  await verifyMock('mockWalletJournal.json', z.array(EsiWalletJournalEntrySchema));
  
  console.log('\nAll mock data is 100% compliant with Zod schemas!');
}

main().catch((err) => {
  console.error('Unhandled Verification Error:', err);
  process.exit(1);
});
