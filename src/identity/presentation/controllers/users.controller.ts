import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUserProfileQuery } from '../../application/queries/get-user-profile/get-user-profile.query';
import { UserProfileView } from '../../application/queries/get-user-profile/user-profile.view';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { UserProfileResponseDto } from '../dto/user-profile.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return this.queryBus.execute<GetUserProfileQuery, UserProfileView>(
      new GetUserProfileQuery(user.sub),
    );
  }
}
