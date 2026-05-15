import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only letters, numbers, and underscores',
  })
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
