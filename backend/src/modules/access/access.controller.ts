import { Controller, Post, Body, Headers, UseGuards, Param, Patch, Req } from '@nestjs/common';
import { AccessService } from './access.service';
import { TerminalsService } from './terminals.service';
import { TerminalAuthGuard } from './guards/terminal-auth.guard';
import { CardAssignmentService } from './card-assignment.service';
import { CheckAccessDto, CheckAccessResponseDto, PingResponseDto } from './dto/access.dto';

@Controller('access')
export class AccessController {
  constructor(
    private accessService: AccessService,
    private terminalsService: TerminalsService,
  ) {}

  @Post('test')
  async test() {
    console.log('✅ AccessController test endpoint hit');
    return { message: 'Access module is working' };
  }

  @Post('check')
  @UseGuards(TerminalAuthGuard)
  async checkAccess(
    @Body() dto: CheckAccessDto,
    @Req() req: any,
  ): Promise<CheckAccessResponseDto> {
    const terminalId = req.terminalId;
    return this.accessService.checkAccess(terminalId, dto.cardUid); // Terminal already validated
  }

  @Post('terminals/ping')
  @UseGuards(TerminalAuthGuard)
  async pingTerminal(@Req() req: any): Promise<PingResponseDto> {
    const terminal = req.terminal;
    return {
      id: terminal.id,
      name: terminal.name,
      gymId: terminal.gymId,
      gymName: terminal.gym.name,
    };
  }
}