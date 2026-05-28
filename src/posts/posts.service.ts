import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams, PaginationDto } from '../common/dto/pagination.dto';
import { authorProfileSelect } from '../users/user-profile.select';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const authorSelect = authorProfileSelect;

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        imageUrl: dto.imageUrl,
        authorId,
      },
      select: this.postSelect(authorId),
    });

    return this.mapPost(post);
  }

  async findAll(currentUserId: string, pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationParams(pagination);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: this.postSelect(currentUserId),
      }),
      this.prisma.post.count(),
    ]);

    return {
      data: posts.map((post) => this.mapPost(post)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, currentUserId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: this.postSelect(currentUserId),
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPost(post);
  }

  async update(id: string, authorId: string, dto: UpdatePostDto) {
    const post = await this.findPostOrThrow(id);
    this.assertAuthor(post.authorId, authorId);

    const updated = await this.prisma.post.update({
      where: { id },
      data: dto,
      select: this.postSelect(authorId),
    });

    return this.mapPost(updated);
  }

  async remove(id: string, authorId: string) {
    const post = await this.findPostOrThrow(id);
    this.assertAuthor(post.authorId, authorId);

    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deleted successfully' };
  }

  private postSelect(currentUserId: string) {
    return {
      id: true,
      content: true,
      imageUrl: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: currentUserId },
        select: { userId: true },
      },
    } as const;
  }

  private mapPost(
    post: {
      id: string;
      content: string;
      imageUrl: string | null;
      authorId: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
      _count: { likes: number; comments: number };
      likes: { userId: string }[];
    },
  ) {
    const { likes, _count, ...rest } = post;
    return {
      ...rest,
      likeCount: _count.likes,
      commentCount: _count.comments,
      likedByMe: likes.length > 0,
    };
  }

  private async findPostOrThrow(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private assertAuthor(postAuthorId: string, currentUserId: string) {
    if (postAuthorId !== currentUserId) {
      throw new ForbiddenException('You can only modify your own posts');
    }
  }
}
