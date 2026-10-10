<!-- markdownlint-disable MD013 -->
# Pull Request

## Summary

Provide a concise description of the changes made and the motivation behind them.

## Related Issue

Closes #(issue number)

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Refactor / Performance improvement
- [ ] Documentation update
- [ ] Test / Mock fixture update

## Verification Checklist

Please verify each of the following before requesting review:

- [ ] Ran `npm run verify` and all checks passed (`type-check`, `verify-mocks`, `lint`, `test:core`, `deps:check`).
- [ ] Adheres to [AGENTS.md](AGENTS.md) conventions (strict TypeScript, no `any`, no unsafe `as` casts, fail loudly).
- [ ] Zod schemas enforce `.strict()` on ESI models.
- [ ] Zustand stores remain pure state containers (I/O and side effects isolated to repositories/services).
- [ ] Any test mock data uses real fixtures cloned from `tests/fixtures/` and validates via `npm run verify-mocks`.
- [ ] EVE time boundaries are tested (exact zero boundary).
- [ ] No server-side features (`app/api/`, `"use server"`, `middleware.ts`) introduced.

## Screenshots / Visual UI (if applicable)

If this change touches UI components, attach before/after screenshots or terminal verification logs here.
