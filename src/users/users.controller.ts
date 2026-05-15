import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Post(':id/follow')
  follow(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.follow(user.sub, id);
  }

  @Delete(':id/follow')
  unfollow(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.unfollow(user.sub, id);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.usersService.getFollowers(id, pagination);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.usersService.getFollowing(id, pagination);
  }
}
