import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class JwtPayload {
  sub: string;
  username: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
