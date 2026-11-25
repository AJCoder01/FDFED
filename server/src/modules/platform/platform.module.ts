import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformRepository } from './platform.repository';

@Module({
  controllers: [PlatformController],
  providers: [PlatformRepository, PlatformService],
  exports: [PlatformRepository, PlatformService],
})
export class PlatformModule {}
