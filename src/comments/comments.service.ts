import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams, PaginationDto } from '../common/dto/pagination.dto';
import { authorProfileSelect } from '../users/user-profile.select';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactCommentDto } from './dto/react-comment.dto';

const authorSelect = authorProfileSelect;

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    await this.ensurePostExists(postId);

    if (dto.parentId) {
      const parent = await this.ensureCommentExists(dto.parentId);
      if (parent.postId !== postId) {
        throw new ForbiddenException('Parent comment does not belong to this post');
      }
    }

    return this.prisma.comment.create({
      data: { content: dto.content, postId, authorId, parentId: dto.parentId },
      select: {
        id: true, content: true, postId: true,
        parentId: true, authorId: true,
        createdAt: true, updatedAt: true,
        author: { select: authorSelect },
        _count: { select: { replies: true, reactions: true } },
      },
    });
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
    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}