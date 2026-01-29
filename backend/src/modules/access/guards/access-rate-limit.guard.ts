import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type Bucket = {
  count: number;
  resetAtMs: number;
};

@Injectable()
export class AccessRateLimitGuard implements CanActivate {
  private buckets = new Map<string, Bucket>();

  private windowMs(): number {
    const raw = process.env.ACCESS_RATE_LIMIT_WINDOW_MS;
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
  }

  private maxRequests(): number {
    const raw = process.env.ACCESS_RATE_LIMIT_MAX;
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
  }

  private getClientIp(req: any): string {
    // Prefer Cloudflare when present.
    const cf = req.headers?.['cf-connecting-ip'];
    if (typeof cf === 'string' && cf.trim()) return cf.trim();

    const xff = req.headers?.['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0].trim();
    }

    const realIp = req.headers?.['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();

    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  private consume(key: string): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const windowMs = this.windowMs();
    const max = this.maxRequests();

    const existing = this.buckets.get(key);
    if (!existing || now >= existing.resetAtMs) {
      const resetAtMs = now + windowMs;
      const bucket = { count: 1, resetAtMs };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: max - 1, resetInMs: resetAtMs - now };
    }

    existing.count += 1;
    const remaining = Math.max(0, max - existing.count);
    const allowed = existing.count <= max;
    return { allowed, remaining, resetInMs: Math.max(0, existing.resetAtMs - now) };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // TerminalAuthGuard sets this.
    const terminalId = req.terminalId as string | undefined;
    const ip = this.getClientIp(req);

    // If terminalId is missing, let downstream guards/controllers handle it.
    if (!terminalId) return true;

    // Rate limit per terminal + IP.
    const key = `access_check:${terminalId}:${ip}`;
    const res = this.consume(key);

    if (!res.allowed) {
      throw new HttpException(
        `Too many requests. Try again in ${Math.ceil(res.resetInMs / 1000)}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
