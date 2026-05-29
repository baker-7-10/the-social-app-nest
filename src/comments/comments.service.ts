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
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });

      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parent.postId !== postId) {
        throw new ForbiddenException('Parent comment does not belong to the same post');
      }
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
        parentId: dto.parentId,
      },
      select: {
        id: true,
        content: true,
        postId: true,
        parentId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
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
        where: { postId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          postId: true,
          parentId: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
          author: { select: authorSelect },
          _count: { select: { replies: true, reactions: true } },
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async react(commentId: string, userId: string, dto: ReactCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    try {
      return this.prisma.reaction.create({
        data: {
          emoji: dto.emoji,
          userId,
          commentId,
        },
      });
    } catch (e: any) {
      // ignore unique-constraint duplicates
      return this.prisma.reaction.findFirst({ where: { emoji: dto.emoji, userId, commentId } });
    }
  }

  async unreact(commentId: string, userId: string, emoji: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.reaction.deleteMany({ where: { commentId, userId, emoji } });

    return { message: 'Reaction removed' };
  }

  async getReactions(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const groups = await this.prisma.reaction.groupBy({
      by: ['emoji'],
      where: { commentId },
      _count: { _all: true },
    });

    return groups.map((g) => ({ emoji: g.emoji, count: g._count._all }));
  }

  async remove(id: string, authorId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id } });

    return { message: 'Comment deleted successfully' };
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }
}
