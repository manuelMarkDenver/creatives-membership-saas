export class CheckAccessDto {
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