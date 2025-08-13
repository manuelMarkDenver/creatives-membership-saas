import { Module } from '@nestjs/common';
import { GymSubscriptionsModule } from './subscriptions/gym-subscriptions.module';
import { GymMembershipPlansModule } from './membership-plans/gym-membership-plans.module';
import { GymLocationsModule } from './locations/gym-locations.module';
import { GymMembersModule } from './members/gym-members.module';

@Module({
  imports: [
    GymSubscriptionsModule,
    GymMembershipPlansModule,
    GymLocationsModule,
    GymMembersModule,
  ],
  exports: [
    GymSubscriptionsModule,
    GymMembershipPlansModule,
    GymLocationsModule,
    GymMembersModule,
  ],
})
export class GymModule {}
