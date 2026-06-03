 
import { z } from 'zod';
import {
  EsiClones,
  EsiFatigue,
  EsiClonesSchema,
  EsiFatigueSchema,
  EsiTransaction,
  EsiTransactionSchema,
  EsiShip,
  EsiShipSchema,
  EsiMailLabels,
  EsiMailLabelsSchema,
  EsiContract,
  EsiContractSchema,
  EsiMarketOrder
} from '../../schemas/esi';
import { nowMs, msPerHour, msPerDay, TWO_DAYS, TEN_DAYS, FIVE_HOURS, clone } from './constants';

import characterClonesRaw from '../../../tests/fixtures/character_clones.json';
import characterFatigueRaw from '../../../tests/fixtures/character_fatigue.json';
import characterTransactionsRaw from '../../../tests/fixtures/character_transactions.json';
import characterShipRaw from '../../../tests/fixtures/character_ship.json';
import characterMailLabelsRaw from '../../../tests/fixtures/character_mail_labels.json';
import characterContractsRaw from '../../../tests/fixtures/character_contracts.json';

export const defaultClones: EsiClones = EsiClonesSchema.parse(clone(characterClonesRaw));
defaultClones.last_clone_jump_date = new Date(nowMs - TWO_DAYS * msPerDay).toISOString();
defaultClones.last_station_change_date = new Date(nowMs - TEN_DAYS * msPerDay).toISOString();
EsiClonesSchema.parse(defaultClones);

export const defaultFatigue: EsiFatigue = EsiFatigueSchema.parse(clone(characterFatigueRaw));
defaultFatigue.jump_fatigue_expire_date = new Date(nowMs + FIVE_HOURS * msPerHour).toISOString();
defaultFatigue.last_jump_date = new Date(nowMs - FIVE_HOURS * msPerHour).toISOString();
defaultFatigue.last_update_date = new Date(nowMs - FIVE_HOURS * msPerHour).toISOString();
EsiFatigueSchema.parse(defaultFatigue);

export const defaultTransactions: EsiTransaction[] = z.array(EsiTransactionSchema).parse(clone(characterTransactionsRaw));
defaultTransactions[0]!.date = new Date(nowMs - FIVE_HOURS * msPerHour).toISOString();
z.array(EsiTransactionSchema).parse(defaultTransactions);

export const defaultShip: EsiShip = EsiShipSchema.parse(clone(characterShipRaw));
EsiShipSchema.parse(defaultShip);

export const defaultMail: EsiMailLabels = EsiMailLabelsSchema.parse(clone(characterMailLabelsRaw));
EsiMailLabelsSchema.parse(defaultMail);

export const defaultContracts: EsiContract[] = z.array(EsiContractSchema).parse(clone(characterContractsRaw));
defaultContracts[0]!.date_issued = new Date(nowMs - TWO_DAYS * msPerDay).toISOString();
defaultContracts[0]!.date_expired = new Date(nowMs + TEN_DAYS * msPerDay).toISOString();
z.array(EsiContractSchema).parse(defaultContracts);

export const defaultMarketOrders: EsiMarketOrder[] = [
  {
    duration: 30,
    escrow: 45.6,
    is_buy_order: true,
    is_corporation: false,
    issued: "2016-09-03T05:12:25Z",
    location_id: 60003760,
    min_volume: 1,
    order_id: 123456789,
    price: 33.3,
    range: "station",
    region_id: 10000002,
    type_id: 34,
    volume_remain: 4422,
    volume_total: 123456
  }
];
