/** Fields returned on GET/PATCH /users/me and auth responses. */
export const privateProfileFields = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatarUrl: true,
  coverUrl: true,
  location: true,
  website: true,
  pronouns: true,
  gender: true,
  phone: true,
  dateOfBirth: true,
  isPrivate: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const profileCounts = {
  select: {
    posts: true,
    followers: true,
    following: true,
  },
} as const;

export const profileSelect = {
  ...privateProfileFields,
  _count: profileCounts,
} as const;

/** Public profile — no email, phone, or date of birth. */
export const publicProfileSelect = {
  id: true,
  username: true,
  displayName: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatarUrl: true,
  coverUrl: true,
  location: true,
  website: true,
  pronouns: true,
  gender: true,
  isPrivate: true,
  createdAt: true,
  _count: profileCounts,
} as const;

/** Compact author snippet on posts and comments. */
export const authorProfileSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;
