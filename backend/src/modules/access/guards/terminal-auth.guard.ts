import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TerminalsService } from '../terminals.service';

@Injectable()
export class TerminalAuthGuard implements CanActivate {
  constructor(private terminalsService: TerminalsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const encodedId = request.headers['x-terminal-id-encoded'];
    const encodedSecret = request.headers['x-terminal-secret-encoded'];

    console.log('🔐 TERMINAL AUTH: Headers - ID present:', !!encodedId, 'Secret present:', !!encodedSecret);

    if (!encodedId || !encodedSecret) {
      console.log('❌ TERMINAL AUTH: Missing authentication headers');
      return false;
    }

    // Decode both
    const terminalId = Buffer.from(encodedId, 'base64').toString('utf-8');
    console.log('🔐 TERMINAL AUTH: Decoded terminal ID:', terminalId);

    try {
      const terminal = await this.terminalsService.validateTerminal(
        terminalId,
        encodedSecret,
      );

      if (!terminal) {
        console.log('❌ TERMINAL AUTH: Terminal validation returned null');
        return false;
      }

      console.log('✅ TERMINAL AUTH: Success - Terminal:', terminalId, 'Gym:', terminal.gymId);
      request.terminal = terminal;
      request.terminalId = terminalId;
      return true;
    } catch (error) {
      console.log('❌ TERMINAL AUTH: Validation error:', error.message);
      return false;
    }
  }
}
