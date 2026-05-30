import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '../notifications/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams, PaginationDto } from '../common/dto/pagination.dto';
import { authorProfileSelect } from '../users/user-profile.select';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactCommentDto } from './dto/react-comment.dto';

const authorSelect = authorProfileSelect;

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.ensurePostExists(postId);

    let parentComment = null;
    if (dto.parentId) {
      parentComment = await this.ensureCommentExists(dto.parentId);
      if (parentComment.postId !== postId) {
        throw new ForbiddenException('Parent comment does not belong to this post');
      }
    }

    const comment = await this.prisma.comment.create({
      data: { content: dto.content, postId, authorId, parentId: dto.parentId },
      select: {
        id: true, content: true, postId: true,
        parentId: true, authorId: true,
        createdAt: true, updatedAt: true,
        author: { select: authorSelect },
        _count: { select: { replies: true, reactions: true } },
      },
    });

    if (parentComment && parentComment.authorId !== authorId) {
      await this.notificationsService.create(parentComment.authorId, {
        senderId: authorId,
        recipientId: parentComment.authorId,
        type: NotificationType.REPLY,
        message: 'Someone replied to your comment.',
        linkUrl: `/posts/${postId}`,
      });
    } else if (!dto.parentId && post.authorId !== authorId) {
      await this.notificationsService.create(post.authorId, {
        senderId: authorId,
        recipientId: post.authorId,
        type: NotificationType.COMMENT,
        message: 'Someone commented on your post.',
        linkUrl: `/posts/${postId}`,
      });
    }

    return comment;
  }

  async findByPost(postId: string, pagination: PaginationDto) {
    await this.ensurePostExists(postId);
    const { skip, take, page, limit } = getPaginationParams(pagination);

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null }, // ✅ top-level فقط
        skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, content: true, postId: true,
          parentId: true, authorId: true,
          createdAt: true, updatedAt: true,
          author: { select: authorSelect },
          _count: { select: { replies: true, reactions: true } },
        },
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async react(commentId: string, userId: string, dto: ReactCommentDto) {
    await this.ensureCommentExists(commentId);

    return this.prisma.commentReaction.upsert({
      where: {
        userId_commentId_emoji: { userId, commentId, emoji: dto.emoji }
      },
      create: { emoji: dto.emoji, userId, commentId },
      update: {},
    });
  }

  async unreact(commentId: string, userId: string, emoji: string) {
    await this.ensureCommentExists(commentId);
    await this.prisma.commentReaction.deleteMany({ where: { commentId, userId, emoji } });
    return { message: 'Reaction removed' };
  }

  async getReactions(commentId: string) {
    await this.ensureCommentExists(commentId);

    const reactions = await this.prisma.commentReaction.findMany({
      where: { commentId },
      select: {
        emoji: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const grouped = reactions.reduce((acc: any, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      acc[r.emoji].count++;
      acc[r.emoji].users.push(r.user);
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async remove(id: string, authorId: string) {
    const comment = await this.ensureCommentExists(id);

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id } });
    return { message: 'Comment deleted successfully' };
  }

  private async ensureCommentExists(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}