import { IsString } from 'class-validator';

export class CheckAccessDto {
  @IsString()
  cardUid: string;
}

export class CheckAccessResponseDto {
  result: string;
  message?: string;
  memberName?: string;
  expiresAt?: string;
}

export class PingResponseDto {
  id: string;
  name: string;
  gymId: string;
  gymName: string;
}
