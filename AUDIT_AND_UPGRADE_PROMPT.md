# Enterprise-Grade Audit & Upgrade Prompt
## For Next.js App Router + LowDB / Supabase Stack

> **How to use:** Paste this entire document as your first message when starting a new Claude session on this codebase. It replaces all prior ad-hoc prompts.

---

## 1 — Project Context (fill before sending)

```
Stack       : Next.js [VERSION] · React [VERSION] · TypeScript strict
DB          : LowDB (file-based JSON) | Supabase PostgreSQL   ← delete one
Auth        : Custom HMAC-SHA256 tokens | Supabase Auth       ← delete one
Proxy/Edge  : src/proxy.ts (Next.js Middleware)
Runtime     : Node.js 18+ (server actions + API routes)
CSS         : Tailwind CSS
Target load : [N] concurrent users · [N] records · [N] RPS
```

Read the actual `package.json` before touching any API — this project's Next.js version may have breaking changes from training data. Check `node_modules/next/dist/docs/` if unsure.

---

## 2 — Constraints (NON-NEGOTIABLE)

- **Zero** TypeScript errors (`tsc --noEmit` must exit 0)
- **Zero** ESLint errors (`eslint . --ext .ts,.tsx` must exit 0)
- **Zero** breaking changes to external API contracts, DB schema, env-var names, or UI behavior
- **Zero** unused imports, dead exports, or unreachable branches left behind
- **Zero** `console.log` / `console.error` in production paths
- Prefer editing existing files over creating new ones
- Every fix must be in dependency order: `types → lib → hooks → components → pages`
- After all edits: run `tsc --noEmit`, `eslint`, then `next build` — all must pass before reporting done

---

## 3 — Full Audit Scope

Run all checks in parallel where possible, fix in a single coordinated pass.

### 3.1 Code Quality

- [ ] Duplicate logic — identical functions defined in more than one file (date formatters, status maps, color maps, QR generators, auth helpers)
- [ ] Inline constants that belong in `lib/types.ts` or `lib/constants.ts` (status labels, color classes, magic numbers)
- [ ] Local utility functions that shadow shared ones already in `lib/`
- [ ] Components with private state + `useEffect` that duplicate logic already in a shared hook
- [ ] Files over 800 lines — split by feature boundary
- [ ] Functions over 50 lines — extract named helpers
- [ ] Nesting depth > 4 — flatten with early returns
- [ ] Dead code: unused exports, unreferenced imports, commented-out blocks
- [ ] `as any` / `@ts-ignore` — replace with proper types
- [ ] `catch (e)` with variable declared but never used — change to `catch`
- [ ] `console.*` calls — remove or replace with structured logger

### 3.2 Security

- [ ] Auth token signing — must use HMAC-SHA256 (`crypto.subtle`, works in both Node and Edge), not `btoa`/`atob`
- [ ] All token functions async — `makeToken`, `isValidToken`, `decodeToken`
- [ ] Cookie options — `httpOnly: true`, `sameSite: "strict"`, `secure: process.env.NODE_ENV === "production"`
- [ ] Login endpoint — IP-based rate limiting (5 attempts / 15 min window, in-memory Map for single-server, Redis for multi-server)
- [ ] All server actions — validate session at entry; never trust client-sent user/role data
- [ ] No hardcoded secrets, API keys, or passwords anywhere in source
- [ ] User input — validated at system boundary before DB write (never trust form values directly)
- [ ] SQL / NoSQL injection — parameterized queries only; for LowDB, validate IDs with regex before array lookups
- [ ] Error messages — never leak stack traces or internal paths to the client
- [ ] CSRF — Next.js server actions are CSRF-safe by default; verify this is not bypassed with raw fetch
- [ ] File paths — no user-controlled strings passed to `fs.*` without sanitization
- [ ] Audit log — write an append-only record for every create / update / delete / login / logout action

### 3.3 Performance

**Rendering**
- [ ] Every page that does not need client interactivity must be a Server Component (no `"use client"` at page level)
- [ ] `"use client"` pushed to leaf nodes only (buttons, forms, interactive widgets)
- [ ] Heavy components wrapped in `<Suspense fallback={...}>` with streaming
- [ ] Large third-party imports (QR, PDF, chart libs) dynamically imported with `await import(...)` inside effects or server actions — never at module top level

**Data**
- [ ] No N+1 patterns — denormalize or join in a single `getData()` call, not per-row lookups in JSX
- [ ] Large lists paginated (cursor or offset) — never load unbounded arrays into the page
- [ ] Search / filter done server-side, not by loading all records then filtering in the browser
- [ ] LowDB: read once per request via `getData()` — do not call it multiple times in the same render

**Assets**
- [ ] All `<img>` replaced with Next.js `<Image>` with explicit `width` / `height`
- [ ] Fonts loaded with `next/font` — no `@import url(...)` in CSS at runtime
- [ ] No `<style>` blocks importing Google Fonts in page components (move to layout or `next/font`)

**Bundle**
- [ ] Check `next build` output for unexpectedly large page bundles (> 150 kB gzipped for landing pages, > 300 kB for app pages)
- [ ] Ensure no heavy server-only library (e.g., `fs`, `crypto`, database clients) leaks into client bundles

### 3.4 Scalability (single-server LowDB vs. Supabase)

**LowDB (file-based)**
- [ ] All writes go through a single async `mutate()` function — never write `db.data` directly
- [ ] `mutate()` performs daily backup via `copyFileSync` before first write each day (keep 7 rolling copies)
- [ ] Backup is non-fatal (wrapped in `try/catch`) — a failed backup must not abort the write
- [ ] No concurrent write race — LowDB is synchronous; `mutate()` must be serialized if you add async operations inside it
- [ ] Add `/data/backups/*.json` to `.gitignore`

**Supabase (if applicable)**
- [ ] RLS enabled on every table — no policy = no access
- [ ] All queries use parameterized calls (`supabase.from().select().eq()`) — never template strings
- [ ] Connection pooling via Supabase's built-in pooler (port 6543) for serverless contexts
- [ ] Indexes on every foreign key and every column used in `.eq()`, `.in()`, `.order()`
- [ ] Cursor pagination for all list queries that may return > 100 rows
- [ ] `count: "exact"` only when you actually display the total — otherwise omit it

### 3.5 Reliability

- [ ] Every Server Action returns a typed result `{ success: boolean; error?: string }` — never throws unhandled
- [ ] Every API route has a `try/catch` returning a proper HTTP status code
- [ ] `notFound()` called for missing DB records — never returns empty data to the page
- [ ] `redirect()` called correctly (outside try/catch in Next.js 15+, it throws internally)
- [ ] Rate limiter `checkRateLimit` called before processing login — failed check returns `429` immediately
- [ ] Environment variables validated at startup — fail fast with a clear message if required vars are missing

---

## 4 — Shared Utility Standards

These must exist in `lib/` and be the single source of truth across the entire codebase.

### `lib/format.ts`
```ts
// Short date: "22 มิ.ย. 2568" — for table cells
export function formatDate(value: string | Date | null | undefined): string

// Long date: "22 มิถุนายน 2568" — for documents, receipts, quotations
export function formatDateLong(value: string | Date | null | undefined): string

// Thai baht with comma: "1,234,567.00"
export function formatBaht(value: number): string

// Decimal with comma: "1,234.50"
export function formatDecimal(value: number): string
```
- Use `Intl.DateTimeFormat("th-TH", ...)` with a module-level cached formatter (not `new Intl.DateTimeFormat` per call)
- Return `"—"` for null / undefined / invalid date — never throw

### `lib/types.ts`
- All domain types and their status union types defined here
- All status label maps `Record<StatusType, string>` defined here
- All status color maps `Record<StatusType, string>` (Tailwind classes) defined here
- No page or component may define its own local status map — it must import from here

### `lib/constants.ts`
- Magic numbers extracted here: `MAX_LOGIN_ATTEMPTS`, `RATE_LIMIT_WINDOW_MS`, `BACKUP_KEEP_COUNT`, etc.

### `hooks/usePromptPayQR.ts` (or equivalent)
- Any logic shared across ≥ 2 components must be extracted to a custom hook in `src/hooks/`
- The hook must use `cancelled` flag pattern to prevent state updates on unmounted components
- `setState` must not be called synchronously in the effect body — only inside async functions or callbacks

---

## 5 — TypeScript Rules

- `strict: true` in `tsconfig.json`
- No `as any` — use proper generics or type narrowing
- `as SomeType` only when narrowing from a parent union (e.g., `status as DealStatus`) — always comment why
- Prefer `unknown` over `any` for caught errors; type-narrow before using
- All Server Action return types explicitly declared
- All API route handler types explicitly declared (`NextRequest` → `NextResponse<T>`)
- No implicit `any` from untyped third-party libs — add `@types/*` or write a `.d.ts` shim

---

## 6 — Component Rules

- Server Components: no hooks, no event handlers, no `"use client"`, async data fetching at the top
- Client Components: minimal state, push `"use client"` to the leaf, no direct DB/FS access
- No inline anonymous components defined inside render (e.g., `function Badge()` inside another component's return) — extract to a named export or a separate file
- Shared UI: reusable components live in `src/components/` — never duplicate JSX structure across pages
- Props: never pass raw DB objects to client components — pass only the serializable fields needed

---

## 7 — Fix Execution Order

When implementing fixes, always proceed in this order to avoid cascading type errors:

```
1. lib/types.ts          — add/fix type definitions, status maps, constants
2. lib/format.ts         — add/fix shared formatters
3. lib/auth.ts           — security fixes (async, HMAC)
4. lib/db.ts             — reliability fixes (mutate, backup)
5. lib/rate-limit.ts     — new if missing
6. src/hooks/            — new/updated custom hooks
7. src/components/       — update to use shared hooks + imports
8. src/app/**/page.tsx   — update to use shared types + formatters
9. src/proxy.ts          — update if auth.ts changed signatures
10. src/app/login/       — rate limiting integration
```

---

## 8 — Validation Gates (must all pass before done)

```bash
# 1. TypeScript — zero errors
npx tsc --noEmit

# 2. ESLint — zero errors
npx eslint . --ext .ts,.tsx

# 3. Tests (if configured)
npx vitest run

# 4. Production build — must complete without errors
npx next build
```

Report the exact output of each gate. If any gate fails, fix before reporting complete.

---

## 9 — Enterprise Readiness Targets

| Dimension | Target | How to verify |
|-----------|--------|---------------|
| Security | 0 hardcoded secrets · HMAC tokens · rate limiting · secure cookies | ESLint + manual grep for `btoa`, `atob`, hardcoded strings |
| Performance | TTFB < 200 ms · LCP < 2.5 s · no unbounded DB reads | `next build` bundle sizes + Lighthouse |
| Reliability | All routes return typed errors · no unhandled throws | Code review of every action/route |
| Code quality | 0 TS errors · 0 ESLint errors · 0 duplicate logic | `tsc` + `eslint` gate |
| Scalability | Stateless reads · serialized writes · rolling backups | Code review of `db.ts` |
| Observability | Structured error logging · audit trail for mutations | grep for `console.*` + audit log |

---

## 10 — Out of Scope for This Pass

Do NOT do the following unless explicitly asked:

- Migrate DB from LowDB to Supabase
- Add new features or pages
- Change UI design or Tailwind classes (beyond fixing bugs)
- Add Cloudflare Workers / CDN / edge caching
- Set up CI/CD, Docker, or deployment pipelines
- Add Sentry, monitoring, or alerting
- Add tests if none exist today

These belong in separate sessions with separate prompts.

---

## 11 — Deliverable

When complete, provide a summary table:

| File | Change | Reason |
|------|--------|--------|
| `src/lib/auth.ts` | HMAC-SHA256, async functions | Security: token forgery prevention |
| `src/lib/rate-limit.ts` | New file | Security: brute-force protection |
| ... | ... | ... |

Then paste the exit codes of all four validation gates.
