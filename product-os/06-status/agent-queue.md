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
- [ ] **0.H.3** GitHub rule: `main` PR-only (block direct v0 push)

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
- [ ] **2.O.2** n8n workflow-f missed schedule alert — human+agent doc slice

### Bundle D — Closed loops

- [ ] **3.1** Cursor Automation: CI failed → fix agent — human creates in Automations editor
- [ ] **3.2** Cursor Automation: Sentry staging → triage agent — human creates in Automations editor
- [x] **3.6** PR labeler (`lane:*`, `app:*`) — PR #159 (in progress)
- [x] **1.M.3** Marketing analytics slice guard — PR #161
- [ ] **1.M.4** Insights markdown linter — `chore/automation-marketing-insights-lint`
- [ ] **1.M.5** Marketing PNG size budget — `chore/automation-marketing-png-budget`

### Bundle E — Confidence to auto-promote

- [ ] **4.4** Playwright marketing 3-path smoke — `chore/automation-marketing-playwright`
- [ ] **4.5** Playwright dashboard 3-path smoke — `chore/automation-dashboard-playwright`
- [ ] **4.7** Release health gate script + workflow — `chore/automation-release-health-gate`
- [ ] **4.1** OpenAPI → TS codegen (dashboard proxy) — `chore/automation-openapi-codegen-dashboard`

### Offline annex (`offline-automation-runbook.md`)

- *(1.O + 3.O.1 complete — next offline slice parked under Phase 4 / nightly)*

### Later phases (parked — do not start until Bundle D merged)

- [ ] **1.4** Turbo affected filter in CI
- [ ] **2.2** Sentry alert rules → Slack
- [ ] **2.5** Wire onboarding proxy smoke — blocked: secrets
- [ ] **2.6** Backend Railway post-deploy health
- [ ] **2.7** Golden staging tenant doc + seed extension
- [ ] **2.9** Env parity checklist script
- [ ] **2.10** Weekly Supabase advisors job
- [ ] **2.11** Scheduled RLS evidence
- [ ] **2.M.1** Email template render smoke
- [ ] **2.M.2** SEO smoke (sitemap, robots)
- [ ] **2.O.3** n8n daily outreach intelligence
- [ ] **3.3** Weekly health Cursor Automation
- [ ] **3.5** Dependabot babysit automation
- [ ] **3.7–3.10** CODEOWNERS enforce, stale PR, PR templates, auto-merge fixes
- [ ] **4.2–4.3, 4.6, 4.8–4.10, 4.M.1–4.M.2** — see automation-ops-plan §Phase 4
- [ ] **5.1–5.10** — see automation-ops-plan §Phase 5

---

## Ready — features (Lane 3)

Use `build-feature` + `start-agent-task`. Do not start while a guardrails PR touches the same app directory.

- [ ] *(none queued — human adds next product slice from `current-focus.md`)*

---

## In progress

- *(none — pick next Ready slice from Bundle D)*

---

## Recently completed (awaiting merge)

- [ ] *(none)*

---

## Blocked

- [ ] **2.5** Onboarding proxy smoke in CI — needs `DASHBOARD_BASE_URL` + `TRACEBUD_SMOKE_BEARER_TOKEN` in GitHub secrets
- [ ] **3.1–3.2** Cursor Automations — create in Automations editor after Bundle A green
- [ ] **4.4–4.7** Playwright + release health — needs golden staging tenant (2.7) + `ci-secrets-and-fixtures.md`
- [ ] **1.2 (activation)** Turbo remote cache — optional: add `TURBO_TOKEN` / `TURBO_TEAM` in GitHub for cross-run cache hits (CI wired PR #158)
- [ ] **0.H.3** Branch protection PR-only — human

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
