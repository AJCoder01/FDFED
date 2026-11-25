import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { GovernanceRepository } from './governance.repository';

@Module({
  controllers: [GovernanceController],
  providers: [GovernanceRepository, GovernanceService],
  exports: [GovernanceRepository, GovernanceService],
})
export class GovernanceModule {}
