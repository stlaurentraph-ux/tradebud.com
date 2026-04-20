export function buildEudrDdsSubmitSuccessMessage(input: { statusCode?: number; replayed?: boolean }): string {
  const statusCode = input.statusCode ?? 200;
  if (input.replayed) {
    return `EUDR DDS replay acknowledged (status ${statusCode}). No duplicate side effects created.`;
  }
  return `EUDR DDS submitted (status ${statusCode}).`;
}
