import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TerminalsService {
  constructor(private prisma: PrismaService) {}

  async validateTerminal(terminalId: string, encodedSecret: string): Promise<any> {
    // Decode the base64 encoded secret
    const secret = Buffer.from(encodedSecret, 'base64').toString('utf-8');

    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: { gym: true },
    });

    if (!terminal || !terminal.isActive) {
      throw new Error('Terminal not found or inactive');
    }

    const isValid = await bcrypt.compare(secret, terminal.secretHash);
    if (!isValid) {
      throw new Error('Invalid terminal secret');
    }

    // Update last seen
    await this.prisma.terminal.update({
      where: { id: terminalId },
      data: { lastSeenAt: new Date() },
    });

    return terminal;
  }

  async ping(terminalId: string, secret: string) {
    const terminal = await this.validateTerminal(terminalId, secret);
    return {
      id: terminal.id,
      name: terminal.name,
      gymId: terminal.gymId,
      gymName: terminal.gym.name,
    };
  }
}