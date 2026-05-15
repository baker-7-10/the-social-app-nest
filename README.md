# Social Media API

Production-ready NestJS backend with Prisma ORM and PostgreSQL. Features JWT authentication, user profiles with follow/unfollow, posts (CRUD with image URLs), comments, and likes.

## Tech Stack

- NestJS 11
- Prisma ORM + PostgreSQL
- JWT + Passport
- class-validator / class-transformer

## Prerequisites

- Node.js 18+
- Docker (optional, for local PostgreSQL)

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET` for production.

2. Start PostgreSQL (Docker):

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Run database migrations:

```bash
npx prisma migrate deploy
```

For development with schema changes, use `npx prisma migrate dev` instead.

5. Start the development server:

```bash
npm run start:dev
```

The API runs at `http://localhost:3000/api`.

## API Endpoints

All routes except auth require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register (`email`, `username`, `password`) |
| POST | `/api/auth/login` | Login (`email`, `password`) |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me` | Current user profile |
| PATCH | `/api/users/me` | Update `bio`, `avatarUrl` |
| GET | `/api/users/:id` | User profile |
| POST | `/api/users/:id/follow` | Follow user |
| DELETE | `/api/users/:id/follow` | Unfollow user |
| GET | `/api/users/:id/followers` | Paginated followers |
| GET | `/api/users/:id/following` | Paginated following |

### Posts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts` | Create post |
| GET | `/api/posts` | List posts (`?page=1&limit=20`) |
| GET | `/api/posts/:id` | Get post |
| PATCH | `/api/posts/:id` | Update own post |
| DELETE | `/api/posts/:id` | Delete own post |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts/:postId/comments` | Add comment |
| GET | `/api/posts/:postId/comments` | List comments |
| DELETE | `/api/comments/:id` | Delete own comment |

### Likes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts/:postId/like` | Like post |
| DELETE | `/api/posts/:postId/like` | Unlike post |

## Example Requests

**Sign up:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","username":"alice","password":"password123"}'
```

**Create a post:**

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello world!","imageUrl":"https://example.com/image.jpg"}'
```

**Like a post:**

```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Production Notes

- Use a long, random `JWT_SECRET` and never commit `.env`
- Run migrations in CI/CD with `npx prisma migrate deploy`
- Serve behind HTTPS
- Consider rate limiting on auth endpoints

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development server with hot reload |
| `npm run build` | Compile for production |
| `npm run start:prod` | Run compiled app |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Create/apply migrations (dev) |
