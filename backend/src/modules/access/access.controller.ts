import { Controller, Post, Body, Headers, UseGuards, Param, Patch } from '@nestjs/common';
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
  // @UseGuards(TerminalAuthGuard)
  async checkAccess(
    @Headers('x-terminal-id') terminalId: string,
    @Headers('x-terminal-secret') terminalSecret: string,
    @Body() dto: CheckAccessDto,
  ): Promise<CheckAccessResponseDto> {
    return this.accessService.checkAccess(terminalId, terminalSecret, dto.cardUid);
  }

  @Post('terminals/ping')
  async pingTerminal(
    @Headers('x-terminal-id') terminalId: string,
    @Headers('x-terminal-secret') terminalSecret: string,
  ): Promise<PingResponseDto> {
    return this.terminalsService.ping(terminalId, terminalSecret);
  }
}