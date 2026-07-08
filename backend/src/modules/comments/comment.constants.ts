export const USER_ROLES = {
  USER: "USER",
  AGENT: "AGENT",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const SUPPORT_ROLES = [
  USER_ROLES.AGENT,
  USER_ROLES.MANAGER,
  USER_ROLES.ADMIN,
] as const;

export const COMMENT_LIST_SORT_ORDER = "asc" as const;