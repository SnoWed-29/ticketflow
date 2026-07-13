import type { AuthenticatedPrincipal } from "../auth/auth.types.js";

export function canManageCategories(
  principal: AuthenticatedPrincipal,
): boolean {
  return principal.roles.some(
    (role) =>
      role === "ticket_manager" ||
      role === "ticket_admin",
  );
}
