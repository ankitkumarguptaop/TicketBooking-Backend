import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithVerifyingUser } from '../guards/verification-token.guard';

/** The user id from the verification cookie. Only valid behind VerificationTokenGuard. */
export const VerifyingUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const id = ctx
      .switchToHttp()
      .getRequest<RequestWithVerifyingUser>().verifyingUserId;
    if (!id)
      throw new Error('VerifyingUserId used without VerificationTokenGuard');
    return id;
  },
);
