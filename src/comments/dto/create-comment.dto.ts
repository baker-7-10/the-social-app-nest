import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
