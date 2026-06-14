import { EsiFetcher } from './EsiFetcher';
import { type EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiWalletSchema, EsiTransactionSchema, EsiMarketOrdersArraySchema, EsiWalletJournalEntrySchema, EsiWallet, EsiTransaction, EsiMarketOrder, EsiWalletJournalEntry } from "../../../schemas/esi";
import type { IWalletEsiService } from "../IEsiService";

export class LiveWalletEsiService implements IWalletEsiService {
    constructor(private fetcher: EsiFetcher) {
    }

    getWallet(charId: string, accessToken: string): Promise<EsiResponse<EsiWallet> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/`, accessToken, charId, EsiWalletSchema, 'wallet');
    }

    getTransactions(charId: string, accessToken: string): Promise<EsiResponse<EsiTransaction[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/v1/characters/${charId}/wallet/transactions/`, accessToken, charId, z.array(EsiTransactionSchema), 'transactions');
    }

    getWalletJournal(charId: string, accessToken: string): Promise<EsiResponse<EsiWalletJournalEntry[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/journal/`, accessToken, charId, z.array(EsiWalletJournalEntrySchema), 'wallet journal');
    }

    getMarketOrders(charId: string, accessToken: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/orders/`, accessToken, charId, EsiMarketOrdersArraySchema, 'market orders');
    }
}
