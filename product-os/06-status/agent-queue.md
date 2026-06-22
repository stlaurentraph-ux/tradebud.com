# Agent queue

Work intake for Cursor / Cloud Agents. **Agents pick only from Ready.** Humans move items between sections.

Refs: `automation-ops-plan.md` (exhaustive plan), `.cursor/rules/agent-operations.mdc`, ADR-007.

**Implementation order:** see automation-ops-plan §16 (Bundles A→E). Pick the **lowest-numbered Ready slice** in the active bundle unless human reprioritized.

---

## Ready — guardrails (Lane 1)

Use `implement-automation-slice`. One slice per PR. Branch: `chore/automation-<slice>`.

### Bundle A — Stop silent broken deploys (do first)

- [x] **0.1** Dashboard `typecheck` script + CI — `chore/automation-phase-0` (typecheck on `main` Phase 3; verified here)
- [x] **0.2** Dashboard `build` in CI (placeholder env) — `chore/automation-phase-0`
- [x] **0.3** `field-auth` CI job — `chore/automation-phase-0`
- [x] **0.4** Root `check:dashboard` script — `chore/automation-phase-0`
- [x] **0.5** `README.md` CI section — `chore/automation-phase-0`

**Human gate (not an agent PR):**

- [x] **0.H** GitHub branch protection — field-auth + marketing required on `main` (2026-06-20)
- [x] **0.H.2** Vercel Deployment Protection — preview SSO + automation bypass (2026-06-20)
- [x] **0.H.3** GitHub rule: `main` PR-only (block direct v0 push) — enabled 2026-06-21

### Bundle B — Agent speed & hygiene

- [x] **1.1** husky + lint-staged — PR #128
- [x] **1.2** Turbo remote cache in CI — PR #158
- [x] **1.3** CI path filters (PR only) — PR #129
- [x] **1.M.1** Marketing route/publication guard — PR #130
- [x] **1.M.2** Marketing API trace size ceiling — PR #132
- [x] **1.5** Dashboard regression guard — PR #140
- [x] **1.D.1** Supabase migration naming/order CI — PR #142
- [x] **1.D.2** Backend ↔ Supabase migration mirror drift check — PR #144
- [x] **3.4** Dependabot config — PR #131

### Bundle C — Verify without manual staging

- [x] **2.1** Sentry env tags (marketing, dashboard, backend) — PR #145
- [x] **2.4** Marketing post-deploy smoke workflow — PR #147
- [x] **2.8** Synthetic uptime checks — PR #150
- [x] **2.O.1** n8n workflow-b website form intake (ops doc + validation) — on `main`; human n8n activation per `workflow-b-activation.md`
- [x] **2.O.2** n8n workflow-f missed schedule alert — PR #165; human n8n activation per `workflow-f-activation.md`

### Bundle D — Closed loops

- [x] **3.1** Cursor Automation: CI failed → fix agent — created in Automations editor (2026-06-21)
- [x] **3.2** Cursor Automation: Sentry staging → triage agent — created in Automations editor (2026-06-21)
- [x] **3.6** PR labeler (`lane:*`, `app:*`) — PR #159 (in progress)
- [x] **1.M.3** Marketing analytics slice guard — PR #161
- [x] **1.M.4** Insights markdown linter — PR #163
- [x] **1.M.5** Marketing PNG size budget — PR #164

### Bundle E — Confidence to auto-promote

- *(Phase 4 guardrails complete; Bundle D closed loops 3.1–3.2 live — next parked: Phase 5 / 2.2 / 3.3+)*

### Offline annex (`offline-automation-runbook.md`)

- *(1.O + 3.O.1 complete — next offline slice parked under Phase 4 / nightly)*

### Later phases (parked — do not start until Bundle D merged)

- [ ] **1.4** Turbo affected filter in CI
- [x] **2.2** Sentry alert rules → email (production, rule 649072) — human setup 2026-06-22
- [x] **2.5** Wire onboarding proxy smoke — PR #185 merged 2026-06-21
- [x] **2.6** Backend Railway post-deploy health — PR #184
- [ ] **2.9** Env parity checklist script
- [ ] **2.10** Weekly Supabase advisors job
- [ ] **2.11** Scheduled RLS evidence
- [x] **2.M.1** Email template render smoke — PR #183
- [x] **2.M.2** SEO smoke (sitemap, robots) — PR #181
- [ ] **2.O.3** n8n daily outreach intelligence
- [ ] **3.3** Weekly health Cursor Automation — `chore/automation-weekly-health-3-3` (PR pending; human: Automations editor)
- [ ] **3.5** Dependabot babysit automation
- [ ] **3.7–3.10** CODEOWNERS enforce, stale PR, PR templates, auto-merge fixes
- [x] **4.9–4.10, 4.M.1–4.M.2** — Phase 4 complete (PRs #176–#179)
- [ ] **5.1–5.10** — see automation-ops-plan §Phase 5

---

## Ready — features (Lane 3)

Use `build-feature` + `start-agent-task`. Do not start while a guardrails PR touches the same app directory.

- [ ] *(none queued — human adds next product slice from `current-focus.md`)*

---

## In progress

- *(none — pick next Ready slice from parked phases or `current-focus.md`)*

---

## Recently completed (awaiting merge)

- [ ] *(none)*

---

## Blocked

- [ ] **1.2 (activation)** Turbo remote cache — optional: add `TURBO_TOKEN` / `TURBO_TEAM` in GitHub for cross-run cache hits (CI wired PR #158)
---

## Done (automation rollout)

- [x] 2026-06-20 — **0.0** Agent ops integration (rules, commands, plan, ADR-007, agent-queue)
- [x] 2026-06-20 — Exhaustive automation-ops-plan rewrite (four loops, Phases 0–5, bundles)
- [x] 2026-06-20 — **0.1–0.5** Dashboard + field-auth Phase 0 CI — `chore/automation-phase-0`
- [x] 2026-06-20 — **0.0.1** Cursor workflow integration — `automation-safety.mdc`, `pick-automation-slice`, PR template lanes, `AGENTS.md` monorepo, `ci-secrets-and-fixtures.md` stub, CODEOWNERS automation paths
- [x] 2026-06-20 — **1.1** husky + lint-staged — PR #128
- [x] 2026-06-20 — **1.3** CI path filters — PR #129
- [x] 2026-06-20 — **2.1** Sentry environment tags — PR #145
- [x] 2026-06-20 — **1.D.2** Supabase migration mirror drift guard — PR #144
- [x] 2026-06-20 — **1.5** Dashboard API proxy regression guard — PR #140
- [x] 2026-06-20 — **1.M.2** Marketing API trace size guard — PR #132
- [x] 2026-06-20 — **3.4** Dependabot config — PR #131
- [x] 2026-06-20 — **1.M.1** Marketing routes publication guard — PR #130
- [x] 2026-06-20 — **2.4** Marketing post-deploy smoke — PR #147
- [x] 2026-06-20 — **2.8** Synthetic uptime probes — PR #150
- [x] 2026-06-21 — **3.2** Cursor Automation Sentry staging → fix regression — Automations editor
- [x] 2026-06-21 — **3.1** Cursor Automation CI failed → fix regression — Automations editor
- [x] 2026-06-21 — **2.6** Backend Railway post-deploy smoke — PR #184
- [x] 2026-06-21 — **2.M.1** Marketing email template render smoke — PR #183
- [x] 2026-06-21 — **2.M.2** Marketing SEO smoke — PR #181
- [x] 2026-06-21 — **4.M.2** Marketing Lighthouse LCP/CLS budgets — PR #179
- [x] 2026-06-21 — **4.M.1** Marketing axe-core a11y routes — PR #178
- [x] 2026-06-21 — **4.10** Stripe webhook replay guard — PR #177
- [x] 2026-06-21 — **4.9** Dashboard mock-vs-real API guard — PR #176
- [x] 2026-06-21 — **4.8** Maestro nightly offline smoke — PR #175
- [x] 2026-06-21 — **4.6** Marketing Playwright preview on PR — PR #174
- [x] 2026-06-21 — **4.2** Offline OpenAPI client codegen — PR #173
- [x] 2026-06-21 — **4.3** Dashboard proxy contract suite — PR #172
- [x] 2026-06-21 — **4.1** Dashboard OpenAPI proxy codegen — PR #171
- [x] 2026-06-21 — **4.7** Release health gate — PR #170
- [x] 2026-06-21 — **4.5** Dashboard Playwright golden paths — PR #168
- [x] 2026-06-21 — **4.4** Marketing Playwright golden paths — PR #167
- [x] 2026-06-21 — **2.7** Golden staging tenant manifest + guard — PR #166
- [x] 2026-06-21 — **2.O.2** n8n workflow-f missed schedule alert — PR #165
- [x] 2026-06-21 — **1.M.5** Marketing PNG size budget — PR #164
- [x] 2026-06-21 — **1.M.4** Insights markdown linter — PR #163
- [x] 2026-06-21 — **1.M.3** Marketing analytics slice guard — PR #161
- [x] 2026-06-21 — **3.6** PR path and lane labeler — PR #159
- [x] 2026-06-21 — **1.2** Turbo remote cache in CI — PR #158
- [x] 2026-06-20 — **1.O.3** Maestro CI preflight + macOS workflow — PR #155
- [x] 2026-06-20 — **1.O.2** Offline automation strict guards in CI — PR #153
- [x] 2026-06-20 — **1.O.1** Offline automation Phase 1 — PR #122 merge; guards + baselines + report-mode CI
- [x] 2026-06-20 — **0.M.0–0.M.3 + 0.H + 0.H.2** — PR #124 merge; Vercel preview protection

---

## Rules

1. One agent per app directory at a time.
2. Mark **In progress** with agent id / branch when starting.
3. Clear **In progress** within 7 days or move back to Ready / Blocked.
4. Feature work waits if guardrails PR is open for the same `apps/<app>/` tree.
5. Prefer Bundle order (A → B → C → D → E) unless human overrides in `current-focus.md`.
6. Lane 2 (`fix/*`) may bypass queue for urgent `main` CI red or production Sentry — still use `fix-regression`.
