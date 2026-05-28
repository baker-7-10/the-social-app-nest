import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { privateProfileFields } from '../users/user-profile.select';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';

const authUserSelect = privateProfileFields;

type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  website: string | null;
  pronouns: string | null;
  gender: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: authUserSelect,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        ...authUserSelect,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash: _, ...profile } = user;

    return this.buildAuthResponse(profile);
  }

  private buildAuthResponse(user: AuthUser) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });

    return { accessToken, user };
  }
}
