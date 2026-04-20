export const GOVERNANCE_SUMMARY_HEADING = '## OpenAPI Governance Checks';

export const buildGovernanceSummaryLines = ({
  readmeStatus,
  policyStatus,
  codeownersStatus,
  overallStatus,
  runUrl,
}) => [
  GOVERNANCE_SUMMARY_HEADING,
  '',
  '- Command: `npm run openapi:governance:readme:check -- --report openapi-governance-readme-report.json`',
  `- README governance validation: ${readmeStatus}`,
  '- Command: `npm run openapi:governance:policy:validate`',
  `- Policy schema validation: ${policyStatus}`,
  '- Command: `npm run openapi:governance:check`',
  `- CODEOWNERS protection validation: ${codeownersStatus}`,
  `- Overall governance status: ${overallStatus}`,
  runUrl
    ? `- Metrics artifact: \`contracts-openapi-governance-metrics\` ([run](${runUrl}))`
    : '- Metrics artifact: `contracts-openapi-governance-metrics`',
  runUrl
    ? `- Raw reports artifact: \`contracts-openapi-governance-reports\` ([run](${runUrl}))`
    : '- Raw reports artifact: `contracts-openapi-governance-reports`',
];
