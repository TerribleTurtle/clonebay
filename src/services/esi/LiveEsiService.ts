import type { IEsiService } from './IEsiService';
import { EsiFetcher } from './live/EsiFetcher';
import { LiveSkillsEsiService } from './live/LiveSkillsEsiService';
import { LiveIndustryEsiService } from './live/LiveIndustryEsiService';
import { LiveWalletEsiService } from './live/LiveWalletEsiService';
import { LiveCharacterEsiService } from './live/LiveCharacterEsiService';
import { LiveUniverseEsiService } from './live/LiveUniverseEsiService';

export class LiveEsiService implements IEsiService {
  private fetcher = new EsiFetcher();
  public skills = new LiveSkillsEsiService(this.fetcher);
  public industry = new LiveIndustryEsiService(this.fetcher);
  public wallet = new LiveWalletEsiService(this.fetcher);
  public character = new LiveCharacterEsiService(this.fetcher);
  public universe = new LiveUniverseEsiService(this.fetcher);
}
