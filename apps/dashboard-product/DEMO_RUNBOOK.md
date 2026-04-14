# Tracebud MVP Demo Runbook (8-10 minutes)

## 1) Setup (1 minute)
- Open `http://localhost:3000`.
- Go to `Admin` and click `Seed Golden Path`.
- Confirm package states include at least one `SUBMITTED`, one `ACCEPTED`/`REJECTED`, and one `ON_HOLD`.

## 2) Producer flow (2 minutes)
- Switch persona to `Producer`.
- Open `Inbox`.
- Show pending requests and missing evidence actions.
- Mark one request as responded and open one linked package action.

## 3) Supplier flow (2 minutes)
- Switch persona to `Supplier`.
- Open `Packages` and then one package detail.
- Demonstrate canonical transitions: `DRAFT -> READY -> SEALED -> SUBMITTED` (with liability confirmation on seal).

## 4) Buyer flow (2 minutes)
- Switch persona to `Buyer`.
- Open a `SUBMITTED` package.
- Demonstrate `Accept Shipment`.
- Demonstrate `Reject Shipment` with reason capture on another submitted package.

## 5) Sponsor flow (2 minutes)
- Switch persona to `Sponsor`.
- Show sponsor dashboard KPIs (reviewed, pending, escalation).
- Open `Role Decisions` and `Audit Log` as governance proof points.

## 6) Close with readiness (1 minute)
- Open `Demo Readiness`.
- Show readiness signals and checklist.
- Mention retry/error-hardening on key pages:
  - `Packages`
  - `DDS`
  - `Compliance Queue`
  - `Admin`
  - `Inbox`

