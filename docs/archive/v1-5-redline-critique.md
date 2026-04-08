# Critical Review of the v1.5 Redline

## Critical analysis: what the redline gets right, and where it fails

The redline makes four genuinely important corrections: it versions regulatory constants properly, tightens the downstream/trader distinction, replaces the flat shipment model with a header/line/coverage architecture, and introduces explicit DDS submission state machines. Those improvements are real and should be kept.[1]

However, as a **build-signoff document**, the redline has at least **25 structural defects** that would block engineers on day one:

### Fatal completeness failures

- **Section 17 is cut off mid-sentence** ("Tracebud provides report-support exports for o"). Sections 18 onwards are entirely absent. A build-signoff document that ends mid-paragraph is not a build-signoff document.
- **§8.14 lists eight "formally added" entities but provides schemas for zero of them.** Declaring `plot_season_volumes`, `yield_exception_requests`, `legal_compliance_requirements`, `sync_conflicts`, `traces_api_logs`, `compliance_issues`, `audit_events`, `access_logs` as "mandatory for build completeness" and then providing no DDL for any of them is meaningless. Engineers cannot build from a name.
- **The `persons` table is the FK target of at least 11 foreign keys** throughout the schema (`billing_owner_id`, `captured_by_user_id`, `changed_by_person_id`, `source_uploaded_by`, `parse_reviewed_by`, etc.) but is never defined anywhere in the document.
- **The `producers` table is the FK target of `simplified_declarations`, `evidence_documents`, and `plots`** but is defined nowhere in v1.5. The v1.3 spec defined it; the redline silently drops it.[1]
- **`consent_grants` is entirely absent.** The farmer data wallet is a stated core differentiator and data-sovereignty mechanism. The consent model that gates all inter-org data access is not defined.
- **`yield_benchmarks` and `yield_engine_profiles` are extensively referenced in the yield engine** (§11) but no schemas are provided. The yield algorithm calls `benchmark.yield_upper_kg_ha`, `engine_profile_version`, and `yield_engine_profiles` — but none of these objects are defined.
- **`country_risk_profiles`** is referenced in `shipment_headers` (`country_risk_tier`, `country_risk_assessed_at`) and in §6.1 as a manual-hold trigger but has no schema, no update cadence, and no versioning rule.
- **`requests`** is a first-class collaboration entity in v1.3 (FR8) — upstream evidence requests, deadlines, reminders, and escalations — but the word "request" appears nowhere in the v1.5 schema section.[1]
- **`billing_events`** is referenced in `shipment_headers.billing_event_id` as a FK target but is never defined.
- **`credential_vault`** is referenced in §12.1 for API-direct mode but has no schema, no encryption standard, no rotation policy, and no access control spec.

### Schema integrity failures

- **`shipment_line_coverages.source_type` and `batch_inputs.source_type` are polymorphic TEXT columns** with no enumeration of valid values. Engineers cannot validate or index these without a defined enum.
- **`regulatory_profiles.constants` is JSONB with no canonical key schema.** Every section that reads from this object (regulatory dates, postal-address eligibility, risk tier thresholds, simplified-path eligibility) requires known keys. Without a canonical structure, this is an unvalidatable blob.
- **`simplified_declarations.geolocation_payload` is JSONB with no structure definition.** What keys it must contain (and when it may be null vs. when `postal_address` may substitute) is stated in prose but not enforced or defined at the schema level.
- **`producer_organisation_memberships`** (or equivalent) is absent. The data model has no formal join entity between producers and cooperatives/exporters, yet the consent, network-visibility, and end-of-relationship rules all depend on it.
- **Duplicate detection produces `SUSPECTED_DUPLICATE_HIGH/MEDIUM` status flags** but there is no `dedup_review_tasks` or equivalent entity to track resolution. Who sees it, who resolves it, and how it moves to a terminal state is completely undefined.

### Configuration without defaults

- **§10.4 deletes the fixed risk-tier thresholds** and says they are "configuration-driven per engine profile." There is no default engine profile defined. Engineers have no starting value to implement.
- **§11.5 deletes the juvenile factor hard-coded curve** and says it is "commodity-profile driven and versioned." No default profile values are provided. The algorithm references `juvenile_factor` in the pseudocode but provides no value.
- **§10.3 deletes the fixed point-buffer distance** but provides no default. The explainability payload must emit it, but there is nothing to emit.

### Missing entire sections

- **No `persons` (user identity) section.** Authentication, RBAC, organisation membership roles, permission levels, and device/session management are entirely absent.
- **No GeoID integration specification.** This is described as a core differentiator in the product thesis and website but has no technical integration spec.
- **No TRACES NT payload schema.** §12 describes submission modes but never specifies what fields the outbound TRACES NT payload must contain, what the response schema looks like, or how field mapping validation is tested.
- **No API contract.** No endpoint design, authentication mechanism, rate limits, versioning policy, or webhook schema.
- **No non-functional requirements.** No latency targets, availability SLAs, data-volume assumptions, or disaster-recovery objectives.
- **No build-phase or release plan.** A build-signoff document that provides no phasing gives engineering no basis for sprint planning.
- **No open questions register.** Unresolved decisions (e.g., which TRACES NT API version, enterprise-size evidence format, credential vault provider) are buried in prose or absent entirely.
- **No `substantiated_concerns` schema.** In-scope per §7.1 but defined nowhere.
- **No `annual_reporting_snapshots` schema.** In-scope per §7.1 but cut off in the truncated §17.
- **No onboarding / invitation flows.** v1.3 had detailed workflow sequences for producer onboarding, plot onboarding, aggregation, and shipment readiness. v1.5 removes all of them without replacement.[1]
