import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.getAllAndOverride<'PRO'>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.plan !== requiredPlan) {
      throw new ForbiddenException(`This feature requires a ${requiredPlan} plan`);
    }

    return true;
  }
}

