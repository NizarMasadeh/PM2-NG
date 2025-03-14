import { Module } from '@nestjs/common';
import { Pm2Service } from './pm2.service';
import { Pm2Controller } from './pm2.controller';

@Module({
  controllers: [Pm2Controller],
  providers: [Pm2Service],
})
export class Pm2Module {}
