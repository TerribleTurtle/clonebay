import { EsiMockFetcher } from './EsiMockFetcher';
import type { EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiWalletSchema, EsiTransactionSchema, EsiMarketOrdersArraySchema, EsiWalletJournalEntrySchema, EsiWallet, EsiTransaction, EsiMarketOrder, EsiWalletJournalEntry } from "../../../schemas/esi";
import type { IWalletEsiService } from "../IEsiService";
import { MS_IN_HOUR, MOCK_JOURNAL_DELAY_HOURS_1, MOCK_JOURNAL_DELAY_HOURS_2 } from "../mockConstants";

export class MockWalletEsiService implements IWalletEsiService {
    constructor(private fetcher: EsiMockFetcher) {
    }

    getWallet(charId: string): Promise<EsiResponse<EsiWallet> | null> {
        return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.isk, EsiWalletSchema);
    }

    getTransactions(charId: string): Promise<EsiResponse<EsiTransaction[]> | null> {
        return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.transactions, z.array(EsiTransactionSchema));
    }

    getWalletJournal(_charId: string): Promise<EsiResponse<EsiWalletJournalEntry[]> | null> {
        const mockJournal: EsiWalletJournalEntry[] = [
                  {
                    id: 100000001,
                    date: new Date().toISOString(),
                    ref_type: 'bounty_prizes',
                    amount: 15000000.50,
                    balance: 1015000000.50,
                    description: 'Bounty prizes',
                    reason: '15000000.50 ISK bounty payout',
                    tax: 500000.0,
                    tax_receiver_id: 1000123
                  },
                  {
                    id: 100000002,
                    date: new Date(Date.now() - MOCK_JOURNAL_DELAY_HOURS_1 * MS_IN_HOUR).toISOString(),
                    ref_type: 'ess_escrow_transfer',
                    amount: 45000000.00,
                    balance: 1000000000.00,
                    description: 'ESS Payout',
                    reason: 'Main Bank Payout'
                  },
                  {
                    id: 100000003,
                    date: new Date(Date.now() - MOCK_JOURNAL_DELAY_HOURS_2 * MS_IN_HOUR).toISOString(),
                    ref_type: 'player_trading',
                    amount: -5000000.00,
                    balance: 955000000.00,
                    description: 'Trade with player',
                    first_party_id: 12345678,
                    second_party_id: 87654321
                  }
                ];
        return this.fetcher.mockResponse(mockJournal, z.array(EsiWalletJournalEntrySchema));
    }

    getMarketOrders(charId: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
        return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.marketOrders, EsiMarketOrdersArraySchema);
    }
}
