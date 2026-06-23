# FEAT: Cross-surface network routing

Structural contract for field app ↔ dashboard handoffs (delivery, consent, campaign inbox).

## Scope

- Shared email → tenant resolution (delivery + campaign fan-out)
- Buyer voucher visibility via active consent in tenant farmer scope
- Registry + guard + integration test

## Out of scope

- Field-app in-app inbox for campaign requests (email/CTA + consent push only)
- Full Playwright cross-app golden path (backend integration test covers delivery routing)

## Quality gates

| Gate | Artifact |
|------|----------|
| Permissions | Consent auto-granted on directed delivery; revoked/denied block; tenant-scoped voucher list |
| State transitions | None → active SHIPMENT_PREPARATION on delivery; pending → active on delivery; voucher issued; invite row pending → sent → claimed |
| Exception handling | Unknown dashboard email → voucher + `buyerInvite` (optional Resend); revoked/denied consent → 400; legacy API without invite → field QR-only fallback |
| Analytics | Existing harvest + consent audit events; `HARVEST_SUBMIT_SUCCESS.buyerInvitePending` when invite pending |
| Acceptance | `network-routing-delivery.int.spec.ts` + `deliveryBuyerInviteMessages.test.ts` green |

## References

- `product-os/04-quality/network-routing-registry.md`
- `tracebud-backend/src/network/networkRoutingRegistry.ts`
