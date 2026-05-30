export const NotificationType = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  FOLLOW: 'FOLLOW',
  REPLY: 'REPLY',
  MENTION: 'MENTION',
  CUSTOM: 'CUSTOM',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
