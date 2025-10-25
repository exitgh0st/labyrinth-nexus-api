import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from 'src/user/user.service';

export const CurrentUser = createParamDecorator((data: keyof SafeUser | undefined, ctx: ExecutionContext): SafeUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SafeUser;

    if (!user) {
        return null;
    }

    return data ? user[data] : user;
},
);