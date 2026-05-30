import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'REPLY'
  | 'MENTION'
  | 'CUSTOM';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  recipientId: string = '';

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsNotEmpty()
  @IsString()
  type: NotificationType = 'CUSTOM';

  @IsNotEmpty()
  @IsString()
  message: string = '';

  @IsOptional()
  @IsString()
  linkUrl?: string;
}
