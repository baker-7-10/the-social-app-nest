import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactCommentDto } from './dto/react-comment.dto';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  create(
    @CurrentUser() user: JwtPayload,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, user.sub, dto);
  }

  @Get('posts/:postId/comments')
  findByPost(
    @Param('postId') postId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.commentsService.findByPost(postId, pagination);
  }

  @Post('comments/:id/reactions')
  react(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReactCommentDto,
  ) {
    return this.commentsService.react(id, user.sub, dto);
  }

  @Delete('comments/:id/reactions')
  unreact(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReactCommentDto,
  ) {
    return this.commentsService.unreact(id, user.sub, dto.emoji);
  }

  @Get('comments/:id/reactions')
  getReactions(@Param('id') id: string) {
    return this.commentsService.getReactions(id);
  }

  @Delete('comments/:id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.commentsService.remove(id, user.sub);
  }
}
