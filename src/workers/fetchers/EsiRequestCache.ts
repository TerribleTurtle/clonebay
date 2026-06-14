import type { IEsiService } from "../../services/esi/IEsiService";

export class EsiRequestCache {
  private cache = new Map<string, unknown>();
  constructor(private esiService: IEsiService, private charId: string, private accessToken: string) {}

  get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    let cached = this.cache.get(key);
    if (!cached) {
      cached = fetcher();
      this.cache.set(key, cached);
    }
    if (cached instanceof Promise) {
      return cached;
    }
    throw new Error(`Cache error: value for ${key} is not a Promise`);
  }

  getSkillQueue() { return this.get('skills', () => this.esiService.skills.getSkillQueue(this.charId, this.accessToken)); }
  getCharacterSkills() { return this.get('charSkills', () => this.esiService.skills.getCharacterSkills(this.charId, this.accessToken)); }
  getIndustryJobs() { return this.get('industry', () => this.esiService.industry.getIndustryJobs(this.charId, this.accessToken)); }
  getPlanets() { return this.get('planets', () => this.esiService.industry.getPlanets(this.charId, this.accessToken)); }
  getWallet() { return this.get('wallet', () => this.esiService.wallet.getWallet(this.charId, this.accessToken)); }
  getLocation() { return this.get('location', () => this.esiService.character.getLocation(this.charId, this.accessToken)); }
  getShip() { return this.get('ship', () => this.esiService.character.getShip(this.charId, this.accessToken)); }
  getClones() { return this.get('clones', () => this.esiService.character.getClones(this.charId, this.accessToken)); }
  getFatigue() { return this.get('fatigue', () => this.esiService.character.getFatigue(this.charId, this.accessToken)); }
  getTransactions() { return this.get('transactions', () => this.esiService.wallet.getTransactions(this.charId, this.accessToken)); }
  getMailLabels() { return this.get('mailLabels', () => this.esiService.character.getMailLabels(this.charId, this.accessToken)); }
  getContracts() { return this.get('contracts', () => this.esiService.character.getContracts(this.charId, this.accessToken)); }
  getMarketOrders() { return this.get('marketOrders', () => this.esiService.wallet.getMarketOrders(this.charId, this.accessToken)); }
  getNotifications() { return this.get('notifications', () => this.esiService.character.getCharacterNotifications(this.charId, this.accessToken)); }
  getWalletJournal() { return this.get('journal', () => this.esiService.wallet.getWalletJournal(this.charId, this.accessToken)); }
}
