import type { IEsiService } from './IEsiService';
import { fetchEsi, type EsiResponse } from '../../utils/esiClient';
import { z } from 'zod';
import {
  EsiSkillQueueSchema,
  EsiIndustryJobSchema,
  EsiPlanetSchema,
  EsiPlanetLayoutSchema,
  EsiCharacterSkillsResponseSchema,
  EsiWalletSchema,
  EsiLocationSchema,
  EsiShipSchema,
  EsiClonesSchema,
  EsiFatigueSchema,
  EsiTransactionSchema,
  EsiMailLabelsSchema,
  EsiContractSchema,
  EsiMarketOrdersArraySchema,
  EsiSkillQueue,
  EsiIndustryJob,
  EsiPlanet,
  EsiPlanetLayout,
  EsiCharacterSkillsResponse,
  EsiWallet,
  EsiLocation,
  EsiShip,
  EsiClones,
  EsiFatigue,
  EsiTransaction,
  EsiMailLabels,
  EsiContract,
  EsiMarketOrder
} from '../../schemas/esi';
import { logger } from '../../utils/logger';

export class LiveEsiService implements IEsiService {
  private safeFetch<T>(url: string, accessToken: string, characterId: string, schema: z.ZodType<T>, name: string): Promise<EsiResponse<T> | null> {
    return fetchEsi({ url, accessToken, characterId, schema }).catch(error => {
      if (error instanceof z.ZodError) {
        logger.error(`ESI Worker: Contract Validation Error fetching ${name} for ${characterId}`, error);
      } else if (error instanceof TypeError) {
        logger.error(`ESI Worker: Network Error fetching ${name} for ${characterId}`, error.message);
      } else {
        logger.error(`ESI Worker: Error fetching ${name} for ${characterId}`, error);
      }
      throw error;
    });
  }

  /**
   * Fetches the character's skill queue.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiSkillQueue[]> | null>} The parsed skill queue response or null on error.
   */
  getSkillQueue(charId: string, accessToken: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skillqueue/`, accessToken, charId, z.array(EsiSkillQueueSchema), 'skills');
  }

  /**
   * Fetches the character's learned skills.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiCharacterSkillsResponse> | null>} The parsed character skills response or null on error.
   */
  getCharacterSkills(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skills/`, accessToken, charId, EsiCharacterSkillsResponseSchema, 'character skills');
  }

  /**
   * Fetches the character's industry jobs.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiIndustryJob[]> | null>} The parsed industry jobs response or null on error.
   */
  getIndustryJobs(charId: string, accessToken: string): Promise<EsiResponse<EsiIndustryJob[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`, accessToken, charId, z.array(EsiIndustryJobSchema), 'industry jobs');
  }

  /**
   * Fetches the planets owned by the character for Planetary Interaction.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiPlanet[]> | null>} The parsed planets response or null on error.
   */
  getPlanets(charId: string, accessToken: string): Promise<EsiResponse<EsiPlanet[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/`, accessToken, charId, z.array(EsiPlanetSchema), 'planets');
  }

  /**
   * Fetches the specific layout of a PI planet.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @param {number} planetId - The ID of the planet to fetch.
   * @returns {Promise<EsiResponse<EsiPlanetLayout> | null>} The parsed planet layout response or null on error.
   */
  getPlanetLayout(charId: string, accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/${planetId}/`, accessToken, charId, EsiPlanetLayoutSchema, 'planet layout');
  }

  /**
   * Fetches the character's wallet balance.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiWallet> | null>} The parsed wallet response or null on error.
   */
  getWallet(charId: string, accessToken: string): Promise<EsiResponse<EsiWallet> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/`, accessToken, charId, EsiWalletSchema, 'wallet');
  }

  /**
   * Fetches the character's current location (system, station, or structure).
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiLocation> | null>} The parsed location response or null on error.
   */
  getLocation(charId: string, accessToken: string): Promise<EsiResponse<EsiLocation> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/location/`, accessToken, charId, EsiLocationSchema, 'location');
  }

  /**
   * Fetches the character's currently active ship.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiShip> | null>} The parsed ship response or null on error.
   */
  getShip(charId: string, accessToken: string): Promise<EsiResponse<EsiShip> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/ship/`, accessToken, charId, EsiShipSchema, 'ship');
  }

  /**
   * Fetches the character's clones (home station and jump clones).
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiClones> | null>} The parsed clones response or null on error.
   */
  getClones(charId: string, accessToken: string): Promise<EsiResponse<EsiClones> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/clones/`, accessToken, charId, EsiClonesSchema, 'clones');
  }

  /**
   * Fetches the character's jump fatigue details.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiFatigue> | null>} The parsed fatigue response or null on error.
   */
  getFatigue(charId: string, accessToken: string): Promise<EsiResponse<EsiFatigue> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/fatigue/`, accessToken, charId, EsiFatigueSchema, 'fatigue');
  }

  /**
   * Fetches the character's wallet transactions.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiTransaction[]> | null>} The parsed transactions response or null on error.
   */
  getTransactions(charId: string, accessToken: string): Promise<EsiResponse<EsiTransaction[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/v1/characters/${charId}/wallet/transactions/`, accessToken, charId, z.array(EsiTransactionSchema), 'transactions');
  }

  /**
   * Fetches the character's mail labels and unread counts.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiMailLabels> | null>} The parsed mail labels response or null on error.
   */
  getMailLabels(charId: string, accessToken: string): Promise<EsiResponse<EsiMailLabels> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/labels/`, accessToken, charId, EsiMailLabelsSchema, 'mail labels');
  }

  /**
   * Fetches the character's active contracts.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiContract[]> | null>} The parsed contracts response or null on error.
   */
  getContracts(charId: string, accessToken: string): Promise<EsiResponse<EsiContract[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/contracts/`, accessToken, charId, z.array(EsiContractSchema), 'contracts');
  }

  /**
   * Fetches the character's active market orders.
   * 
   * @param {string} charId - The character's unique ID.
   * @param {string} accessToken - The ESI OAuth access token.
   * @returns {Promise<EsiResponse<EsiMarketOrder[]> | null>} The parsed market orders response or null on error.
   */
  getMarketOrders(charId: string, accessToken: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/orders/`, accessToken, charId, EsiMarketOrdersArraySchema, 'market orders');
  }
}
