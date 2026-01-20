import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TerminalsService } from '../terminals.service';

@Injectable()
export class TerminalAuthGuard implements CanActivate {
  constructor(private terminalsService: TerminalsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const encodedId = request.headers['x-terminal-id-encoded'];
    const encodedSecret = request.headers['x-terminal-secret-encoded'];

    console.log('Headers received:', { encodedId, encodedSecret });

    if (!encodedId || !encodedSecret) {
      console.log('Missing headers');
      return false;
    }

    // Decode both
    const terminalId = Buffer.from(encodedId, 'base64').toString('utf-8');
    console.log('Decoded terminalId:', terminalId);

    try {
      const terminal = await this.terminalsService.validateTerminal(terminalId, encodedSecret);
      request.terminal = terminal;
      request.terminalId = terminalId;
      return true;
    } catch (error) {
      console.log('Validation error:', error.message);
      return false;
    }
  }
}