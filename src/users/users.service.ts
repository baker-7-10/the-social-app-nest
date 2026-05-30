import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '../notifications/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams, PaginationDto } from '../common/dto/pagination.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  profileSelect,
  publicProfileSelect,
} from './user-profile.select';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  getMe(userId: string) {
    return this.findProfileOrThrow(userId);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    await this.findProfileOrThrow(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: profileSelect,
    });
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicProfileSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('You cannot follow yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    await this.prisma.follow.create({
      data: { followerId, followingId },
    });

    await this.notificationsService.create(followingId, {
      senderId: followerId,
      recipientId: followingId,
      type: NotificationType.FOLLOW,
      message: 'Someone started following you.',
      linkUrl: `/users/${followerId}`,
    });

    return { message: 'Followed successfully' };
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(userId: string, pagination: PaginationDto) {
    await this.ensureUserExists(userId);
    const { skip, take, page, limit } = getPaginationParams(pagination);

    const [data, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          follower: {
            select: publicProfileSelect,
          },
        },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: data.map((f) => ({ ...f.follower, followedAt: f.createdAt })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(userId: string, pagination: PaginationDto) {
    await this.ensureUserExists(userId);
    const { skip, take, page, limit } = getPaginationParams(pagination);

    const [data, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          following: {
            select: publicProfileSelect,
          },
        },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: data.map((f) => ({ ...f.following, followedAt: f.createdAt })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async findProfileOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
