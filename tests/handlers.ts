import { http, HttpResponse } from 'msw';
import mockPlanets from './fixtures/mockPlanets.json';
import mockIndustryJobs from './fixtures/mockIndustryJobs.json';
import mockSkillQueue from './fixtures/mockSkillQueue.json';
import mockSde from './fixtures/mockSde.json';
import mockOauth from './fixtures/mockOauth.json';
import mockNotifications from './fixtures/mockNotifications.json';
import mockWalletJournal from './fixtures/mockWalletJournal.json';

export const handlers = [
  http.get('https://esi.evetech.net/latest/characters/:characterId/skillqueue/', () => {
    return HttpResponse.json(mockSkillQueue);
  }),
  
  http.get('https://esi.evetech.net/latest/characters/:characterId/industry/jobs/', () => {
    return HttpResponse.json(mockIndustryJobs);
  }),
  
  http.get('https://esi.evetech.net/latest/characters/:characterId/planets/', () => {
    return HttpResponse.json(mockPlanets);
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/skills/', () => {
    return HttpResponse.json({ skills: [], total_sp: 50000000 });
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/wallet/', () => {
    return HttpResponse.json(1500000000);
  }),

  http.get('https://esi.evetech.net/v1/characters/:characterId/wallet/transactions/', () => {
    return HttpResponse.json([
      {
        transaction_id: 1234567890,
        date: "2026-06-03T17:51:00Z",
        client_id: 987654321,
        location_id: 60003760,
        type_id: 34,
        unit_price: 500000.0,
        quantity: 1,
        is_buy: true,
        is_personal: true,
        journal_ref_id: 999888777
      }
    ]);
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/location/', () => {
    return HttpResponse.json({ solar_system_id: 30000142 });
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/ship/', () => {
    return HttpResponse.json({
      ship_item_id: 1000000016991,
      ship_name: "SPACESHIPS!!!",
      ship_type_id: 1233
    });
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/clones/', () => {
    return HttpResponse.json({
      home_location: { location_id: 1021348135816, location_type: 'station' },
      jump_clones: []
    });
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/fatigue/', () => {
    return HttpResponse.json({});
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/mail/labels/', () => {
    return HttpResponse.json({ total_unread_count: 0, labels: [] });
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/contracts/', () => {
    return HttpResponse.json([]);
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/orders/', () => {
    return HttpResponse.json([
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
    ]);
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/notifications/', () => {
    return HttpResponse.json(mockNotifications);
  }),

  http.get('https://esi.evetech.net/latest/characters/:characterId/wallet/journal/', () => {
    return HttpResponse.json(mockWalletJournal);
  }),

  http.get('https://esi.evetech.net/latest/universe/systems/:systemId/', ({ params }) => {
    return HttpResponse.json({ 
      constellation_id: 20000020,
      name: 'Jita',
      position: { x: 0, y: 0, z: 0 },
      security_status: 0.9,
      system_id: Number(params['systemId']) || 30000142
    });
  }),

  http.get('https://esi.evetech.net/latest/universe/types/:typeId/', ({ params }) => {
    const typeId = Number(params['typeId']);
    const sdeArray = Array.isArray(mockSde) ? mockSde : [mockSde];
    const typeData = sdeArray.find((t: { type_id?: number }) => t.type_id === typeId);
    return HttpResponse.json(typeData || sdeArray[0]);
  }),

  http.post('https://login.eveonline.com/v2/oauth/token', () => {
    return HttpResponse.json(mockOauth);
  })
];
