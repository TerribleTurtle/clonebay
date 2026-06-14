import type { IEsiService } from './IEsiService';
import { EsiMockFetcher } from './mock/EsiMockFetcher';
import { MockSkillsEsiService } from './mock/MockSkillsEsiService';
import { MockIndustryEsiService } from './mock/MockIndustryEsiService';
import { MockWalletEsiService } from './mock/MockWalletEsiService';
import { MockCharacterEsiService } from './mock/MockCharacterEsiService';
import { MockUniverseEsiService } from './mock/MockUniverseEsiService';

export class MockEsiService implements IEsiService {
  private fetcher = new EsiMockFetcher();
  public skills = new MockSkillsEsiService(this.fetcher);
  public industry = new MockIndustryEsiService(this.fetcher);
  public wallet = new MockWalletEsiService(this.fetcher);
  public character = new MockCharacterEsiService(this.fetcher);
  public universe = new MockUniverseEsiService(this.fetcher);
}
