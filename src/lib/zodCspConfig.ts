import { z } from 'zod';

/**
 * Disable Zod's JIT object parser.
 *
 * Zod v4 probes for eval support with `new Function("")` the first time it parses an object.
 * The site's CSP has no 'unsafe-eval', so that probe throws. Zod catches the error, but the
 * browser still logs a CSP violation. Setting `jitless` skips the probe and uses the
 * interpreted parser instead. Parsing results are the same.
 *
 * Imported for its side effect first in each JS realm, before any schema parses:
 * src/instrumentation-client.ts (main thread) and src/workers/esiWorker.ts (ESI worker).
 */
z.config({ jitless: true });
