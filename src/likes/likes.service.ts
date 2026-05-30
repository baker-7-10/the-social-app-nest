import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '../notifications/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async like(postId: string, userId: string) {
    const post = await this.ensurePostExists(postId);

    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      throw new ConflictException('Post already liked');
    }

    await this.prisma.like.create({
      data: { userId, postId },
    });

    if (post.authorId !== userId) {
      await this.notificationsService.create(post.authorId, {
        senderId: userId,
        recipientId: post.authorId,
        type: NotificationType.LIKE,
        message: 'Someone liked your post.',
        linkUrl: `/posts/${postId}`,
      });
    }

    return { message: 'Post liked successfully' };
  }

  async unlike(postId: string, userId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) {
      throw new NotFoundException('Like not found');
    }

    await this.prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });

    return { message: 'Post unliked successfully' };
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }
}
