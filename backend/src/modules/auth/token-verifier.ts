import type { JWTVerifyGetKey } from "jose" with {
  "resolution-mode": "import",
};
import { z } from "zod";

import { getKeycloakAuthConfig } from "./auth.config";
import {
    SUPPORT_GROUPS,
    TICKET_ROLES,
    type AccessTokenVerifier,
    type AuthenticatedPrincipal,
    type KeycloakAuthConfig,
    type SupportGroup,
    type TicketRole
} from "./auth.types";


const keycloakAccessTokenClaimsSchema = z
    .object({
        sub: z.string().min(1),
        azp: z.string().min(1),
        typ: z.literal("Bearer"),
        preferred_username: z.string().min(1).optional(),
        email: z.string().optional(),
        name: z.string().optional(),
        groups: z.array(z.string()).optional(),
        realm_access: z
        .object({
            roles: z.array(z.string()).optional(),
        })
        .optional(),
        resource_access: z.unknown().optional(),
    })
    .passthrough();


function isRecord(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isTicketRole(role: string): role is TicketRole {
  return (TICKET_ROLES as readonly string[]).includes(role);
}

function isSupportGroup(group: string): group is SupportGroup {
  return (SUPPORT_GROUPS as readonly string[]).includes(group);
}


function extractClientRoles(
  resourceAccess: unknown,
  clientId: string,
): string[] {
  if (!isRecord(resourceAccess)) {
    return [];
  }

  const clientAccess = resourceAccess[clientId];

  if (!isRecord(clientAccess)) {
    return [];
  }

  const roles = clientAccess.roles;

  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter(
    (role): role is string => typeof role === "string",
  );
}

function extractTicketRoles(
  realmRoles: string[],
  clientRoles: string[],
): TicketRole[] {
  const receivedRoles = new Set([
    ...realmRoles,
    ...clientRoles,
  ]);

  return TICKET_ROLES.filter((role) =>
    receivedRoles.has(role),
  );
}

function extractSupportGroups(groups: string[]): SupportGroup[] {
  return groups.filter(isSupportGroup);
}

export function createKeycloakAccessTokenVerifier(
  config: KeycloakAuthConfig,
  keyResolver?: JWTVerifyGetKey,
): AccessTokenVerifier {
  let resolvedKeyResolver = keyResolver;

  return async (
    token: string,
  ): Promise<AuthenticatedPrincipal> => {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");

    resolvedKeyResolver ??= createRemoteJWKSet(
      new URL(config.jwksUrl),
    );

    const { payload } = await jwtVerify(token, resolvedKeyResolver, {
      issuer: config.issuer,
      audience: config.audience,

      
      algorithms: ["RS256"],

      requiredClaims: [
        "sub",
        "iat",
        "exp",
        "azp",
        "typ",
      ],

      
      clockTolerance: 5,
    });

    const claims =
      keycloakAccessTokenClaimsSchema.parse(payload);

    if (!config.allowedClients.includes(claims.azp)) {
      throw new Error(
        `Access token was issued to an unauthorized client: ${claims.azp}`,
      );
    }

    const realmRoles =
      claims.realm_access?.roles ?? [];

    const clientRoles = extractClientRoles(
      claims.resource_access,
      config.audience,
    );

    const roles = extractTicketRoles(
      realmRoles,
      clientRoles,
    );

    const groups = extractSupportGroups(
      claims.groups ?? [],
    );

    return {
      subject: claims.sub,

      username:
        claims.preferred_username ?? claims.sub,

      email: claims.email,

      displayName: claims.name,

      clientId: claims.azp,

      roles,

      groups,
    };
  };
}


let defaultVerifier: AccessTokenVerifier | undefined;

function getDefaultVerifier(): AccessTokenVerifier {
  defaultVerifier ??=
    createKeycloakAccessTokenVerifier(
      getKeycloakAuthConfig(),
    );

  return defaultVerifier;
}


export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedPrincipal> {
  return getDefaultVerifier()(token);
}
