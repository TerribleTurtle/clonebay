import { http, HttpResponse } from 'msw';
import mockPlanets from './fixtures/mockPlanets.json';
import mockIndustryJobs from './fixtures/mockIndustryJobs.json';
import mockSkillQueue from './fixtures/mockSkillQueue.json';
import mockSde from './fixtures/mockSde.json';
import mockOauth from './fixtures/mockOauth.json';

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
