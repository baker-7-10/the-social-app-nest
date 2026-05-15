import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
