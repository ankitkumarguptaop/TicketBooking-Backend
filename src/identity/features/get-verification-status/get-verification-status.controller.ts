import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { VerificationTokenGuard } from '../../infra/http/verification-token.guard';
import { VerifyingUserId } from '../../infra/http/verifying-user-id.decorator';
import { GetUserProfileQuery } from '../get-user-profile/get-user-profile.query';
import { UserProfileView } from '../get-user-profile/user-profile.view';
import {
  toVerificationStatus,
  VerificationStatusResponseDto,
} from './verification-status.response.dto';

/** Which contacts are verified yet, during sign-up (verification cookie only). */
@UseGuards(VerificationTokenGuard)
@Controller('auth/verification')
export class GetVerificationStatusController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  async status(
    @VerifyingUserId() userId: string,
  ): Promise<VerificationStatusResponseDto> {
    const user = await this.queryBus.execute<
      GetUserProfileQuery,
      UserProfileView
    >(new GetUserProfileQuery(userId));
    return toVerificationStatus(user);
  }
}
