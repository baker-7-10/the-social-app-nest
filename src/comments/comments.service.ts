import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams, PaginationDto } from '../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
} as const;

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    await this.ensurePostExists(postId);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
      },
      select: {
        id: true,
        content: true,
        postId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: { select: authorSelect },
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
          authorId: true,
          createdAt: true,
          updatedAt: true,
          author: { select: authorSelect },
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
