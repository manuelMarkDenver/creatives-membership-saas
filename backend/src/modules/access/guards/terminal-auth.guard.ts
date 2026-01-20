import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TerminalsService } from '../terminals.service';

@Injectable()
export class TerminalAuthGuard implements CanActivate {
  constructor(private terminalsService: TerminalsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const terminalId = request.headers['x-terminal-id'];
    const terminalSecret = request.headers['x-terminal-secret'];

    if (!terminalId || !terminalSecret) {
      return false;
    }

    try {
      const terminal = await this.terminalsService.validateTerminal(terminalId, terminalSecret);
      request.terminal = terminal;
      return true;
    } catch (error) {
      return false;
    }
  }
}