// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-restricted-syntax
export async function onRequest({ request, env }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (request.method === "GET") {
    return new Response(JSON.stringify({ status: "Serverless Dictionary Online! Please use POST to resolve IDs." }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  try {
    const ids = await request.json();
    if (!Array.isArray(ids)) {
      return new Response("Invalid request", { status: 400 });
    }

    const kv = env.EVE_SDE_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: "KV namespace not bound" }), { status: 500 });
    }

    const result: Record<number, string> = {};
    const missingIds: number[] = [];

    // 1. Check KV Cache
    for (const id of ids) {
      if (typeof id !== 'number') continue;
      const cached = await kv.get(`name:${id}`);
      if (cached) {
        result[id] = cached;
      } else {
        missingIds.push(id);
      }
    }

    // 2. Fetch missing from ESI
    if (missingIds.length > 0) {
      // eslint-disable-next-line no-restricted-globals
      const esiResponse = await fetch('https://esi.evetech.net/latest/universe/names/?datasource=tranquility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missingIds)
      });

      if (esiResponse.ok) {
        // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-explicit-any
        const esiData = await esiResponse.json() as any[];
        for (const item of esiData) {
          result[item.id] = item.name;
          await kv.put(`name:${item.id}`, item.name, { expirationTtl: 2592000 }); // 30 days
        }
      } else {
        // Bulk failed (likely due to a Planet or unresolvable ID). 
        // Fallback to 1-by-1 concurrently via Promise.allSettled on the Edge!
        const fetchPromises = missingIds.map(async (id) => {
          // eslint-disable-next-line no-restricted-globals
          const singleResponse = await fetch('https://esi.evetech.net/latest/universe/names/?datasource=tranquility', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([id])
          });
          if (singleResponse.ok) {
            // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-explicit-any
            const data = await singleResponse.json() as any[];
            if (data && data.length > 0 && data[0].name) {
              return { id, name: data[0].name };
            }
          }
          throw new Error('Unresolvable');
        });

        const results = await Promise.allSettled(fetchPromises);
        for (let i = 0; i < missingIds.length; i++) {
          const id = missingIds[i];
          if (id === undefined) continue;
          const res = results[i];
          if (res && res.status === 'fulfilled') {
            result[id] = res.value.name;
            await kv.put(`name:${id}`, res.value.name, { expirationTtl: 2592000 }); // 30 days
          } else {
            const fallbackName = `Unknown (${id})`;
            result[id] = fallbackName;
            await kv.put(`name:${id}`, fallbackName, { expirationTtl: 86400 }); // 1 day
          }
        }
      }

      // Catch any remaining IDs that ESI silently dropped from the bulk response
      for (const id of missingIds) {
        if (!result[id]) {
          const fallbackName = `Unknown (${id})`;
          result[id] = fallbackName;
          await kv.put(`name:${id}`, fallbackName, { expirationTtl: 86400 }); // 1 day
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  // eslint-disable-next-line no-restricted-syntax
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax
    console.error("Resolve API Error", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    });
  }
}
