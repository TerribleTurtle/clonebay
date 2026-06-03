import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://esi.evetech.net/latest/characters/:characterId/skillqueue/', () => {
    return HttpResponse.json([]);
  }),
  
  http.get('https://esi.evetech.net/latest/characters/:characterId/industry/jobs/', () => {
    return HttpResponse.json([]);
  }),
  
  http.get('https://esi.evetech.net/latest/characters/:characterId/planets/', () => {
    return HttpResponse.json([]);
  })
];
