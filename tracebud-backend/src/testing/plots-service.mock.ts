import { Pool } from 'pg';
import { PlotsService } from '../plots/plots.service';

export function createPlotsServiceForIntTest(pool: Pool): PlotsService {
  return new PlotsService(
    pool,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
}
