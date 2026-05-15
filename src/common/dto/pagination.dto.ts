import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export function getPaginationParams(dto: PaginationDto) {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 20;
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}
