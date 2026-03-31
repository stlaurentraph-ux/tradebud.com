# QA Scenarios

## Canonical source

- `BUILD_READINESS_ARTIFACTS.md` (QA scenarios)

## Mandatory E2E scenarios

1. Offline capture -> sync -> verify -> shipment -> accepted filing
2. Pre-flight failure -> remediation -> re-validation -> filing
3. High risk -> evidence request -> authorized override -> audit trace
4. Sponsor oversight intervention without cross-tenant violation
5. Submission timeout -> idempotent retry -> no duplicate filing
