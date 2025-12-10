import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadType } from 'src/interface/payload-types';
import { RequestWithUser } from 'src/types/express-request-with-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PayloadType => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);