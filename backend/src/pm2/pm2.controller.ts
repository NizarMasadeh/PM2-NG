import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Pm2Service } from './pm2.service';

@Controller('pm2')
@UseGuards(JwtAuthGuard)
export class Pm2Controller {
  constructor(private readonly pm2Service: Pm2Service) {}

  @Get('processes')
  async getProcesses() {
    return this.pm2Service.getProcesses();
  }

  @Get('processes/:id')
  async getProcess(@Param('id') id: string) {
    return this.pm2Service.getProcess(id);
  }

  @Post('processes/:id/start')
  async startProcess(@Param('id') id: string) {
    const success = await this.pm2Service.startProcess(id);
    return { success };
  }

  @Post('processes/:id/stop')
  async stopProcess(@Param('id') id: string) {
    const success = await this.pm2Service.stopProcess(id);
    return { success };
  }

  @Post('processes/:id/restart')
  async restartProcess(@Param('id') id: string) {
    const success = await this.pm2Service.restartProcess(id);
    return { success };
  }

  @Post('processes/:id/reload')
  async reloadProcess(@Param('id') id: string) {
    const success = await this.pm2Service.reloadProcess(id);
    return { success };
  }

  @Get('processes/:id/logs/:type')
  async getLogs(@Param('id') id: string, @Param('type') type: string) {
    return this.pm2Service.getLogs(id, type);
  }

  @Delete('processes/:id/logs')
  async clearLogs(@Param('id') id: string) {
    const success = await this.pm2Service.clearLogs(id);
    return { success };
  }
}
