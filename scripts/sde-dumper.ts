import { promises as fs } from 'node:fs';
import path from 'node:path';

const COMMAND_CENTER_ID = 2256;
const SPACEPORT_ID = 2588;
const EXTRACTOR_ID = 2544;
const STORAGE_FACILITY_ID = 2546;
const TYPE_IDS: number[] = [COMMAND_CENTER_ID, SPACEPORT_ID, EXTRACTOR_ID, STORAGE_FACILITY_ID];
const BASE_URL: string = 'https://esi.evetech.net/latest/universe/types';

async function fetchTypeData(typeId: number): Promise<unknown> {
  const response: Response = await fetch(`${BASE_URL}/${typeId}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch type ${typeId}: ${response.statusText}`);
  }
  return response.json();
}

async function main(): Promise<void> {
  try {
    const dataPromises: Promise<unknown>[] = TYPE_IDS.map(fetchTypeData);
    const results: unknown[] = await Promise.all(dataPromises);

    const fixturePath: string = path.join(process.cwd(), 'tests', 'fixtures', 'mockSde.json');
    const JSON_INDENT = 2;
    await fs.writeFile(fixturePath, JSON.stringify(results, null, JSON_INDENT), 'utf-8');
    
    console.log(`Successfully dumped SDE data to ${fixturePath}`);
  } catch (error: unknown) {
    console.error('Failed to dump SDE data:', error);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});
