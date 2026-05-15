import { Controller, Delete, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { LikesService } from './likes.service';

@Controller('posts')
export class LikesController {
  constructor(private likesService: LikesService) {}

  @Post(':postId/like')
  like(@CurrentUser() user: JwtPayload, @Param('postId') postId: string) {
    return this.likesService.like(postId, user.sub);
  }

  @Delete(':postId/like')
  unlike(@CurrentUser() user: JwtPayload, @Param('postId') postId: string) {
    return this.likesService.unlike(postId, user.sub);
  }
}
