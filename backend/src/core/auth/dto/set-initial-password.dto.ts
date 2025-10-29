import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetInitialPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string; // Email verification token

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
