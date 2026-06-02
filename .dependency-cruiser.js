/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise your solution.',
      from: {},
      to: { circular: true }
    },
    {
      name: 'ui-cannot-import-app',
      comment: 'UI components should not import from app/ (Next.js routing layer).',
      severity: 'error',
      from: { path: '^src/components/ui' },
      to: { path: '^src/app' }
    },
    {
      name: 'ui-cannot-import-auth',
      comment: 'UI components are dumb and should not import auth logic directly.',
      severity: 'error',
      from: { path: '^src/components/ui' },
      to: { path: '^src/lib/auth' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' }
  }
};
