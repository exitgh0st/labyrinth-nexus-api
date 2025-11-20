import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FormattedSafeUser } from 'src/user/utils/transform-user.util';

export const CurrentUser = createParamDecorator((data: keyof FormattedSafeUser | undefined, ctx: ExecutionContext): FormattedSafeUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as FormattedSafeUser;

    if (!user) {
        return null;
    }

    return data ? user[data] : user;
},
);