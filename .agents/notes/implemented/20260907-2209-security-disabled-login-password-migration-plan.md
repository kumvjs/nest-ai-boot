# Disabled Login and Password Migration Plan — Batch M1.6

Timestamp: `2026-09-07T22:09:25+08:00`

## Problem and context

`sys_user.status` existed but authentication did not inspect it, so a disabled account with valid credentials could still receive Access and Refresh Tokens. Passwords are stored as salted MD5, and later user create/reset work risked copying that fast hash unless the transition boundary was made explicit before M5.

## Decision

- Keep the same generic credential error for missing users and wrong passwords.
- Check disabled status only after password verification, then return the existing dedicated disabled-account business error.
- Reject before token generation, Redis login state, permission loading, or success-login logging.
- Remove both `password_hash` and legacy `psalt` from the internal validated user result.
- Do not mutate hashes, install a hashing dependency, or change the database in M1.
- Make M5 an Argon2id-first mixed-algorithm migration following current OWASP guidance, with bcrypt only as a reviewed fallback.

## Alternatives

- Checking status before the password was rejected because it would reveal that an account exists and is disabled even when the caller does not know its password.
- Returning the generic credential error for a correctly authenticated disabled account was not chosen because the project already has a dedicated operator-facing disabled-account error.
- Bulk conversion was rejected because a one-way MD5 hash cannot be converted to a direct Argon2id hash without the plaintext password.
- Permanently wrapping the MD5 output in Argon2id was rejected because it retains weaknesses of the legacy intermediate and is not equivalent to hashing the submitted password directly.
- Implementing the full dual verifier now was rejected because M5 owns password create/reset, persisted password/session versions, migration rollout, and forced logout as one transactional domain change.

## Constraints

- Preserve the login request and `ResOp<{ accessToken }>` response contracts.
- Preserve current credential-error behavior for unknown/wrong credentials.
- Do not issue or persist any token before the enabled-account decision.
- Future hashing parameters must be benchmarked on production-class hardware and compared with the then-current [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Implementation

- `AuthService.validateUser()` verifies the password, rejects `status=false`, then strips `password_hash` and `psalt`.
- Added service contract coverage for unknown users, wrong passwords on disabled users, correctly authenticated disabled users, absence of token/cache/log side effects, and sensitive-field removal.
- Expanded M5 into reversible schema, Argon2id selection/benchmarking, dual verification and opportunistic rehash, password/session invalidation, aggregate rollout measurement, inactive-account reset, rollback window, and legacy-code retirement tasks.
- Updated auth, Vben, API, request-lifecycle, analysis, acceptance, and plan documentation.

## Verification

- Focused Jest: 1 suite and 9 tests passed.
- Full core Jest: 10 suites and 36 tests passed.
- Test TypeScript compilation passed.
- Focused ESLint passed.
- Nest application build passed.
- Vben contract parser tests: 3 passed.
- Locked v5.7.0 contract snapshot and fixtures passed against the verified local locked-commit checkout.
- `git diff --check` passed.

The VitePress documentation build remains unverified because its dependencies are not installed in this workspace. No live database migration or password-hash mutation was required or performed.

## Documentation impact

Current auth and API documentation now describes disabled-login behavior and the Argon2id transition. The request lifecycle includes the trusted-origin guard introduced in M1.5, and the Vben guide identifies the disabled-account business code. Swagger remains the canonical endpoint reference; no new endpoint document was created.

## Consequences and follow-ups

M1 authentication compatibility is complete. M2 should start with the five-type Vben menu domain and reversible `sys_menu` migration design. The password transition remains scheduled under M5 so it is implemented together with create/reset, persisted session-version changes, and forced logout. The new status gate applies to new logins; M5 account-status writes must revoke already-issued sessions and invalidate user/permission caches after commit.
