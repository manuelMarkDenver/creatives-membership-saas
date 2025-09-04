import { Controller, Post, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('api/v1/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  async seedDatabase() {
    return await this.seedService.seedDatabase();
  }

  @Get('status')
  async getSeedStatus() {
    return await this.seedService.getDatabaseStatus();
  }
}
