import type { IEsiService } from "../../services/esi/IEsiService";
import { NameCacheService } from "../../services/NameCacheService";
import { logger } from "../logger";

const MAX_UNREAD_MAILS_TO_FETCH = 3;

export async function buildMailContext(charId: string, esiService: IEsiService, accessToken: string, nameCache: NameCacheService) {
  try {
    const mailResponse = await esiService.character.getMail(charId, accessToken);
    if (!mailResponse?.data) return undefined;

    const unreadMails = mailResponse.data
      .filter((m) => m.is_read === false)
      .slice(0, MAX_UNREAD_MAILS_TO_FETCH);
      
    if (unreadMails.length === 0) {
      return { unreadSubjects: [] };
    }

    const senderIds = unreadMails
      .map((m) => m.from)
      .filter((id): id is number => id !== undefined);
      
    const resolvedSenders = await nameCache.resolveIdsToNames(senderIds);
    
    const unreadSubjects = unreadMails.map((m) => {
      const senderName = m.from
        ? resolvedSenders[m.from] || m.from.toString()
        : "Unknown";
      return `${senderName}: ${m.subject}`;
    });
    
    return { unreadSubjects };
  } catch (e) {
    logger.error(`Failed to fetch mail for hover context for ${charId}`, e);
    throw e;
  }
}
