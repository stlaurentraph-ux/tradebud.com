import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LaunchService } from './launch.service';

@ApiTags('Launch')
@Controller('v1/launch')
export class LaunchCronController {
  constructor(private readonly launchService: LaunchService) {}

  private assertCronToken(tokenRaw: string | undefined): void {
    const expected = process.env.LAUNCH_ONBOARDING_CRON_TOKEN?.trim() ?? '';
    if (!expected) {
      throw new BadRequestException('LAUNCH_ONBOARDING_CRON_TOKEN is not configured.');
    }
    const provided = tokenRaw?.trim() ?? '';
    if (provided.length === 0 || provided !== expected) {
      throw new ForbiddenException('Invalid launch cron token.');
    }
  }

  @Post('onboarding/remind-incomplete')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send resume emails for incomplete signup workspace setup (cron)',
  })
  async remindIncomplete(
    @Headers('x-tracebud-launch-cron-token') cronToken: string | undefined,
  ) {
    this.assertCronToken(cronToken);
    return this.launchService.remindIncompleteOnboarding();
  }
}
