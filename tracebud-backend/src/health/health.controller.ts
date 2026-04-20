import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  private readonly defaultBenchmarkAdminClaims = ['ADMIN', 'COMPLIANCE_MANAGER'];

  private getConfiguredBenchmarkAdminClaims() {
    const raw = process.env.BENCHMARK_ADMIN_ROLE_CLAIMS?.trim();
    if (!raw) {
      return this.defaultBenchmarkAdminClaims;
    }
    return raw
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0);
  }

  @Get('health')
  getHealth() {
    const requiredClaims = this.getConfiguredBenchmarkAdminClaims();
    const warnings: string[] = [];

    if (requiredClaims.length === 0) {
      warnings.push('Benchmark-admin claim configuration is empty; benchmark admin routes may be inaccessible.');
    }

    return {
      status: 'ok',
      warnings,
      benchmarkAdminAuth: {
        claimEnforced: true,
        configured: requiredClaims.length > 0,
        requiredClaims,
      },
    };
  }
}

