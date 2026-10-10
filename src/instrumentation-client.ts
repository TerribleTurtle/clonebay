// Next.js runs this file before the app's client code becomes interactive
// (https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client).
// It must run before any Zod schema parses on the main thread; see zodCspConfig.ts.
import './lib/zodCspConfig';
