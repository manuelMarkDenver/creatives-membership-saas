import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TerminalsService {
  constructor(private prisma: PrismaService) {}

  private generateTerminalSecret(): string {
    // URL-safe, copy/paste friendly
    return crypto.randomBytes(24).toString('base64url');
  }

  private async assertBranchInTenant(params: { tenantId: string; branchId: string }) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: params.branchId, tenantId: params.tenantId, isActive: true },
      select: { id: true },
    });

    if (!branch) {
      throw new BadRequestException(
        'Invalid branchId for tenantId (not found, inactive, or mismatched tenant)',
      );
    }
  }

  async listTerminals(params: { tenantId: string; branchId?: string }) {
    const tenantId = params.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    return this.prisma.terminal.findMany({
      where: {
        tenantId,
        ...(params.branchId ? { gymId: params.branchId } : {}),
      },
      include: {
        gym: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTerminal(params: {
    tenantId: string;
    branchId: string;
    name: string;
  }): Promise<{ id: string; name: string; gymId: string; tenantId: string; secret: string }> {
    const tenantId = params.tenantId;
    const branchId = params.branchId;
    const name = params.name?.trim();

    if (!tenantId || !branchId || !name) {
      throw new BadRequestException('tenantId, branchId, and name are required');
    }

    await this.assertBranchInTenant({ tenantId, branchId });

    const secret = this.generateTerminalSecret();
    const secretHash = await bcrypt.hash(secret, 10);

    const terminal = await this.prisma.terminal.create({
      data: {
        tenantId,
        gymId: branchId,
        name,
        secretHash,
        isActive: true,
      },
      select: { id: true, name: true, gymId: true, tenantId: true },
    });

    return { ...terminal, tenantId: terminal.tenantId || tenantId, secret };
  }

  async rotateTerminalSecret(params: { tenantId: string; terminalId: string }) {
    const tenantId = params.tenantId;
    const terminalId = params.terminalId;
    if (!tenantId || !terminalId) {
      throw new BadRequestException('tenantId and terminalId are required');
    }

    const terminal = await this.prisma.terminal.findFirst({
      where: { id: terminalId, tenantId },
      select: { id: true },
    });
    if (!terminal) {
      throw new BadRequestException('Terminal not found for tenant');
    }

    const secret = this.generateTerminalSecret();
    const secretHash = await bcrypt.hash(secret, 10);

    await this.prisma.terminal.update({
      where: { id: terminalId },
      data: { secretHash },
    });

    return { terminalId, secret };
  }

  async updateTerminal(params: {
    tenantId: string;
    terminalId: string;
    name?: string;
    isActive?: boolean;
    branchId?: string;
  }) {
    const tenantId = params.tenantId;
    const terminalId = params.terminalId;
    if (!tenantId || !terminalId) {
      throw new BadRequestException('tenantId and terminalId are required');
    }

    const terminal = await this.prisma.terminal.findFirst({
      where: { id: terminalId, tenantId },
      select: { id: true },
    });
    if (!terminal) {
      throw new BadRequestException('Terminal not found for tenant');
    }

    if (params.branchId) {
      await this.assertBranchInTenant({ tenantId, branchId: params.branchId });
    }

    return this.prisma.terminal.update({
      where: { id: terminalId },
      data: {
        ...(params.name !== undefined ? { name: params.name.trim() } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
        ...(params.branchId ? { gymId: params.branchId } : {}),
      },
      include: { gym: { select: { id: true, name: true } } },
    });
  }

  async validateTerminal(
    terminalId: string,
    encodedSecret: string,
  ): Promise<any> {
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
