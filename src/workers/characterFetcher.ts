import { logger } from "../utils/logger";
import { processSkills } from "./processors/skillsProcessor";
import { processIndustry } from "./processors/industryProcessor";
import { processPi } from "./processors/piProcessor";
import { processMetrics } from "./processors/metricsProcessor";
import { processStructures } from "./processors/structureProcessor";
import { processNotifications } from "./processors/notificationProcessor";
import { saveCharacterNotifications } from "../repositories/NotificationRepository";
import { saveCharacterWalletJournal } from "../repositories/WalletJournalRepository";
import type { IEsiService } from "../services/esi/IEsiService";
import type { NameCacheService } from "../services/NameCacheService";
import type { EsiResponse } from "../services/esi/esiClient";
import type { EsiCorporationStructure } from "../schemas/esi/corporation";
import type { WorkerContext, CharacterAuthToken } from "./types";

export async function fetchCharacterData(
  charId: string,
  tokenInfo: CharacterAuthToken | undefined,
  isMockMode: boolean,
  workerContext: WorkerContext,
  esiService: IEsiService,
  nameCache: NameCacheService,
  structuresCache: Map<number, Promise<EsiResponse<EsiCorporationStructure[]> | null>>
): Promise<void> {
  try {
    if (!isMockMode && tokenInfo === undefined) {
      return;
    }
    const accessToken = tokenInfo?.accessToken || "mock_token";

    const skillsPromise = esiService.skills.getSkillQueue(charId, accessToken);
    const charSkillsPromise = esiService.skills.getCharacterSkills(charId, accessToken);
    const industryPromise = esiService.industry.getIndustryJobs(charId, accessToken);
    const planetsPromise = esiService.industry.getPlanets(charId, accessToken);
    const walletPromise = esiService.wallet.getWallet(charId, accessToken);
    const locationPromise = esiService.character.getLocation(charId, accessToken);
    const shipPromise = esiService.character.getShip(charId, accessToken);
    const clonesPromise = esiService.character.getClones(charId, accessToken);
    const fatiguePromise = esiService.character.getFatigue(charId, accessToken);
    const transactionsPromise = esiService.wallet.getTransactions(charId, accessToken);
    const mailLabelsPromise = esiService.character.getMailLabels(charId, accessToken);
    const contractsPromise = esiService.character.getContracts(charId, accessToken);
    const marketOrdersPromise = esiService.wallet.getMarketOrders(charId, accessToken);

    const getVal = <T>(result: PromiseSettledResult<T>) => result.status === 'fulfilled' ? result.value : null;

    const metricsProcessing = Promise.allSettled([
      charSkillsPromise,
      walletPromise,
      locationPromise,
      shipPromise,
      skillsPromise,
      clonesPromise,
      fatiguePromise,
      transactionsPromise,
      mailLabelsPromise,
      contractsPromise,
      marketOrdersPromise,
    ])
      .then(
        async ([
          charSkillsSettled,
          walletSettled,
          locationSettled,
          shipSettled,
          skillsSettled,
          clonesSettled,
          fatigueSettled,
          transactionsSettled,
          mailLabelsSettled,
          contractsSettled,
          marketOrdersSettled,
        ]) => {
          await processMetrics({
            charId,
            charName: tokenInfo?.characterName,
            charSkillsResult: getVal(charSkillsSettled),
            walletResult: getVal(walletSettled),
            locationResult: getVal(locationSettled),
            shipResult: getVal(shipSettled),
            skillsResult: getVal(skillsSettled),
            clonesResult: getVal(clonesSettled),
            fatigueResult: getVal(fatigueSettled),
            transactionsResult: getVal(transactionsSettled),
            mailLabelsResult: getVal(mailLabelsSettled),
            contractsResult: getVal(contractsSettled),
            marketOrdersResult: getVal(marketOrdersSettled),
            isMockMode,
            postMessage: (msg) => workerContext.postMessage(msg),
            esiService,
            accessToken,
          });
        },
      )
      .catch((err) => {
        logger.error(`ESI Worker: Error processing metrics for ${charId}`, err);
        workerContext.postMessage({
          type: "ESI_METRICS_UPDATE",
          payload: {
            characterId: charId,
            walletStatus: "Red",
            locationStatus: "Red",
            mailStatus: "Red",
            cloneStatus: "Red",
          },
        });
        throw err;
      });

    const skillsProcessing = skillsPromise
      .then(async (skillsResult) => {
        await processSkills(
          charId,
          skillsResult,
          nameCache,
          (msg) => workerContext.postMessage(msg)
        );
      })
      .catch((err) => {
        logger.error(`ESI Worker: Error processing skills for ${charId}`, err);
        workerContext.postMessage({
          type: "ESI_DATA_UPDATE",
          payload: { characterId: charId, dataType: "skills", status: "Red", data: null },
        });
        throw err;
      });

    const industryProcessing = Promise.allSettled([
      industryPromise,
      charSkillsPromise,
    ])
      .then(async ([industrySettled, charSkillsSettled]) => {
        await processIndustry(
          charId,
          getVal(industrySettled),
          getVal(charSkillsSettled),
          nameCache,
          (msg) => workerContext.postMessage(msg)
        );
      })
      .catch((err) => {
        logger.error(`ESI Worker: Error processing industry for ${charId}`, err);
        workerContext.postMessage({
          type: "ESI_DATA_UPDATE",
          payload: { characterId: charId, dataType: "industry", status: "Red", data: null },
        });
        throw err;
      });

    const piProcessing = planetsPromise
      .then(async (planetsResult) => {
        await processPi(
          charId,
          planetsResult,
          esiService,
          accessToken,
          nameCache,
          (msg) => workerContext.postMessage(msg),
        );
      })
      .catch((err) => {
        logger.error(`ESI Worker: Error processing PI for ${charId}`, err);
        workerContext.postMessage({
          type: "ESI_DATA_UPDATE",
          payload: { characterId: charId, dataType: "pi", status: "Red", data: null },
        });
        throw err;
      });

    const notificationsProcessing = esiService.character.getCharacterNotifications(charId, accessToken)
      .then(async (notificationsResponse) => {
        if (notificationsResponse && notificationsResponse.data) {
          await saveCharacterNotifications(charId, notificationsResponse.data);
          await processNotifications(
            charId,
            notificationsResponse.data,
            esiService,
            (msg) => workerContext.postMessage(msg)
          );
        }
      })
      .catch((err) => {
        logger.error(`ESI Worker: Error fetching/saving notifications for ${charId}`, err);
        throw err;
      });

    const walletJournalProcessing = esiService.wallet.getWalletJournal(charId, accessToken)
      .then(async (journalResponse) => {
        if (journalResponse && journalResponse.data) {
          await saveCharacterWalletJournal(charId, journalResponse.data);
        }
      })
      .catch((err) => {
        logger.error(`ESI Worker: Error fetching/saving wallet journal for ${charId}`, err);
        throw err;
      });

    const structuresProcessing = processStructures(
      charId,
      esiService,
      accessToken,
      structuresCache,
      (msg) => workerContext.postMessage(msg),
    );

    await Promise.all([
      metricsProcessing,
      skillsProcessing,
      industryProcessing,
      piProcessing,
      notificationsProcessing,
      walletJournalProcessing,
      structuresProcessing,
    ]);
  } catch (err) {
    logger.error(`ESI Worker: Error in character loop for ${charId}:`, err);
    workerContext.postMessage({
      type: "ESI_METRICS_UPDATE",
      payload: { characterId: charId, walletStatus: "Red", locationStatus: "Red", mailStatus: "Red", cloneStatus: "Red" },
    });
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "skills", status: "Red", data: null } });
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "industry", status: "Red", data: null } });
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "pi", status: "Red", data: null } });
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "structures", status: "Red", data: null } });
    throw err;
  }
}
