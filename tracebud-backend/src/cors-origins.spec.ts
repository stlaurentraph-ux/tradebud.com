import { isCorsOriginAllowed, parseExtraCorsOrigins } from './cors-origins';

describe('cors-origins', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCors = process.env.TRACEBUD_CORS_ORIGINS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.TRACEBUD_CORS_ORIGINS = originalCors;
  });

  it('allows missing Origin (native mobile)', () => {
    process.env.NODE_ENV = 'production';
    expect(isCorsOriginAllowed(undefined)).toBe(true);
  });

  it('allows tracebud.com subdomains in production', () => {
    process.env.NODE_ENV = 'production';
    expect(isCorsOriginAllowed('https://app.tracebud.com')).toBe(true);
    expect(isCorsOriginAllowed('https://api.tracebud.com')).toBe(true);
  });

  it('blocks unknown origins in production', () => {
    process.env.NODE_ENV = 'production';
    expect(isCorsOriginAllowed('https://evil.example')).toBe(false);
  });

  it('allows localhost in development', () => {
    process.env.NODE_ENV = 'development';
    expect(isCorsOriginAllowed('http://localhost:4001')).toBe(true);
  });

  it('parses TRACEBUD_CORS_ORIGINS extras', () => {
    process.env.TRACEBUD_CORS_ORIGINS = 'https://preview.example, https://app.example ';
    expect(parseExtraCorsOrigins()).toEqual(['https://preview.example', 'https://app.example']);
    process.env.NODE_ENV = 'production';
    expect(isCorsOriginAllowed('https://preview.example')).toBe(true);
  });
});
