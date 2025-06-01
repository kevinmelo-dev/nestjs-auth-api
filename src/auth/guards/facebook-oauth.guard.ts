import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const activate = (await super.canActivate(context)) as boolean;
        return activate;
    }
}