import { Injectable } from '@nestjs/common';
import { TapCooldownRepository } from './tap-cooldown.repository';

const DEFAULT_COOLDOWN_MS = 3000;

@Injectable()
export class TapCooldownService {
  constructor(private tapCooldownRepo: TapCooldownRepository) {}

  /**
   * Returns true if this is a duplicate tap within the cooldown window.
   * Also updates the last-tap timestamp (so repeated spam stays ignored).
   */
  async isDuplicateAndRecordTap(params: {
    terminalId: string;
    cardUid: string;
    cooldownMs?: number;
  }): Promise<{ isDuplicate: boolean; deltaMs?: number; cooldownMs: number }> {
    const cooldownMs = params.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const now = new Date();

    const existing = await this.tapCooldownRepo.findByTerminalAndCard(
      params.terminalId,
      params.cardUid,
    );

    if (existing) {
      const deltaMs = now.getTime() - existing.lastTapAt.getTime();

      await this.tapCooldownRepo.upsertLastTapAt(
        params.terminalId,
        params.cardUid,
        now,
      );

      if (deltaMs >= 0 && deltaMs < cooldownMs) {
        return { isDuplicate: true, deltaMs, cooldownMs };
      }

      return { isDuplicate: false, deltaMs, cooldownMs };
    }

    await this.tapCooldownRepo.upsertLastTapAt(
      params.terminalId,
      params.cardUid,
      now,
    );

    return { isDuplicate: false, cooldownMs };
  }
}
