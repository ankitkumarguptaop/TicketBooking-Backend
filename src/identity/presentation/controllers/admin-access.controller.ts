import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApproveAdminAccessRequestCommand } from '../../application/commands/approve-admin-access-request/approve-admin-access-request.command';
import { CancelAdminAccessRequestCommand } from '../../application/commands/cancel-admin-access-request/cancel-admin-access-request.command';
import { RejectAdminAccessRequestCommand } from '../../application/commands/reject-admin-access-request/reject-admin-access-request.command';
import { SubmitAdminAccessRequestCommand } from '../../application/commands/submit-admin-access-request/submit-admin-access-request.command';
import { AdminAccessRequestView } from '../../application/ports/admin-access-read-model.port';
import { ListAdminAccessRequestsQuery } from '../../application/queries/list-admin-access-requests/list-admin-access-requests.query';
import { UserRole } from '../../domain/user-role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AdminAccessRequestResponseDto } from '../dto/admin-access-request.response.dto';
import { DecideAdminAccessRequestRequestDto } from '../dto/decide-admin-access-request.request.dto';
import { ListAdminAccessRequestsQueryDto } from '../dto/list-admin-access-requests.query.dto';
import { SubmitAdminAccessRequestRequestDto } from '../dto/submit-admin-access-request.request.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

/**
 * Admins by approval: a verified USER asks, the SUPER_ADMIN decides.
 * Routes without @Roles() are open to any signed-in user.
 */
@ApiTags('admin-access')
@ApiCookieAuth('access_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin-access-requests')
export class AdminAccessController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** Ask to become an admin. One pending request at a time. */
  @Post()
  @ApiCreatedResponse({ type: AdminAccessRequestResponseDto })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitAdminAccessRequestRequestDto,
  ): Promise<AdminAccessRequestResponseDto> {
    return this.commandBus.execute<
      SubmitAdminAccessRequestCommand,
      AdminAccessRequestView
    >(new SubmitAdminAccessRequestCommand(user.sub, dto.reason));
  }

  /** My own requests, newest first (to show "pending" / "rejected: <note>"). */
  @Get('mine')
  @ApiOkResponse({ type: [AdminAccessRequestResponseDto] })
  mine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdminAccessRequestResponseDto[]> {
    return this.queryBus.execute<
      ListAdminAccessRequestsQuery,
      AdminAccessRequestView[]
    >(new ListAdminAccessRequestsQuery(undefined, user.sub));
  }

  /** Withdraw my pending request. */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelAdminAccessRequestCommand(id, user.sub),
    );
  }

  /** The super admin's queue (?status=PENDING) or history. */
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: [AdminAccessRequestResponseDto] })
  list(
    @Query() query: ListAdminAccessRequestsQueryDto,
  ): Promise<AdminAccessRequestResponseDto[]> {
    return this.queryBus.execute<
      ListAdminAccessRequestsQuery,
      AdminAccessRequestView[]
    >(new ListAdminAccessRequestsQuery(query.status));
  }

  /**
   * Approve. The requester becomes ADMIN a moment later (event handler)
   * and sees it in tokens from their next refresh.
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: AdminAccessRequestResponseDto })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DecideAdminAccessRequestRequestDto,
  ): Promise<AdminAccessRequestResponseDto> {
    return this.commandBus.execute<
      ApproveAdminAccessRequestCommand,
      AdminAccessRequestView
    >(new ApproveAdminAccessRequestCommand(id, user.sub, dto.note));
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: AdminAccessRequestResponseDto })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DecideAdminAccessRequestRequestDto,
  ): Promise<AdminAccessRequestResponseDto> {
    return this.commandBus.execute<
      RejectAdminAccessRequestCommand,
      AdminAccessRequestView
    >(new RejectAdminAccessRequestCommand(id, user.sub, dto.note));
  }
}
