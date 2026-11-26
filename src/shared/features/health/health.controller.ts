import { Controller, Get } from '@nestjs/common';

/** Liveness probe for Docker / load balancers: the process is up. */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
