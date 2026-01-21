import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { AccessService } from './access.service';
import { TerminalsService } from './terminals.service';
import { TerminalAuthGuard } from './guards/terminal-auth.guard';
import { CardAssignmentService } from './card-assignment.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CheckAccessDto,
  CheckAccessResponseDto,
  PingResponseDto,
} from './dto/access.dto';

@Controller('access')
export class AccessController {
  constructor(
    private accessService: AccessService,
    private terminalsService: TerminalsService,
    private prisma: PrismaService,
  ) {}

  @Post('test')
  async test() {
    console.log('✅ AccessController test endpoint hit');
    return { message: 'Access module is working' };
  }

  @Get('cards')
  async getCards() {
    const cards = await this.prisma.card.findMany({
      include: { member: true },
    });
    return cards.map((c) => ({
      uid: c.uid,
      active: c.active,
      memberName: c.member
        ? `${c.member.firstName} ${c.member.lastName}`
        : 'Unknown',
    }));
  }

  @Post('check')
  @UseGuards(TerminalAuthGuard)
  async checkCardAccess(
    @Body() body: CheckAccessDto,
    @Req() req: any,
  ): Promise<CheckAccessResponseDto> {
    const terminalId = req.terminalId;
    console.log('🔥 CONTROLLER: Access check called with body:', body, 'terminal:', terminalId);
    return this.accessService.checkAccess(terminalId, body.cardUid);
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
