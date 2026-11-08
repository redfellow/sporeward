# Tasks

## 1. Record the shipped contract

- [ ] 1.1 Confirm each account-owned-play and activity-recording requirement against its cited source and tests, and adjust wording only where it differs from main
  - proof: `npx vitest run apps/server/src/accounts/api.test.ts apps/server/src/activity-store.test.ts apps/server/src/app.test.ts`
  - proof: `openspec validate specify-accounts-tester-sign-in-and-acti --strict`
