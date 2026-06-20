# FEAT: Founder OS GTM strategic layer

**Status:** Shipped (migration applied to Supabase 2026-06-20)  
**Branch:** `feature/dashboard-founder-os-gtm`

Extends Founder OS with market registry, pipeline, pilots, partnerships, objection log, ICP scoring, and penetration metrics. Daily outreach uses SQL `generate_daily_actions()`. Pilot forms sync to prospects + `crm.pilots`.

Migration: `supabase/migrations/20260620140000_founder_os_gtm_expansion.sql` (also applied remotely as `founder_os_gtm_expansion`).
