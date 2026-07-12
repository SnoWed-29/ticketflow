export const TICKET_ROLES = [
    "ticket_user",
    "ticket_agent",
    "ticket_manager",
    "ticket_admin"
] as const; 

export type TicketRole = (typeof TICKET_ROLES)[number];

export const SUPPORT_GROUPS = [
    "/it-support",
    "/hr-support",
    "/finance-support",
    "/general-support"
] as const;

export type SupportGroup = (typeof SUPPORT_GROUPS)[number];

export interface AuthenticatedPrincipal {
    
    subject: string;
    username: string;
    email?: string;
    displayName?: string;

    clientId: string;
    roles: TicketRole[];
    groups: SupportGroup[]
}

export interface KeycloakAuthConfig {
    issuer: string;
    jwksUrl: string;
    audience: string;
    allowedClients: string[];
}

export type AccessTokenVerifier = (
    token: string,
) => Promise<AuthenticatedPrincipal>;