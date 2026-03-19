import { SetMetadata } from '@nestjs/common';
import { REQUIRED_PLAN_KEY } from '../guards/plan.guard';

export const RequirePlan = (plan: 'PRO') => SetMetadata(REQUIRED_PLAN_KEY, plan);

