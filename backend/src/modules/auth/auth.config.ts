import { z } from "zod";

import type { KeycloakAuthConfig } from "./auth.types";

const keycloakEnvironmentSchema = z.object({
    KEYCLOAK_ISSUER_URL: z
        .string()
        .url("KEYCLOAK_ISSUER_URL must be a valid URL"),

    KEYCLOAK_JWKS_URL: z
        .string()
        .url("KEYCLOAK_JWKS_URL must be a valid URL"),

    KEYCLOAK_AUDIENCE: z
        .string()
        .trim()
        .min(1, "KEYCLOAK_AUDIENCE is required"),

    KEYCLOAK_ALLOWED_CLIENTS: z
        .string()
        .trim()
        .min(1, "KEYCLOAK_ALLOWED_CLIENTS is required"),
});


export function getKeycloakAuthConfig(): KeycloakAuthConfig {
    const environment = keycloakEnvironmentSchema.parse(process.env);

    const allowedClients = environment.KEYCLOAK_ALLOWED_CLIENTS
        .split(",")
        .map((client) => client.trim())
        .filter((client) => client.length > 0);

    if(allowedClients.length === 0 ) {
        throw new Error(
            "KEYCLOAK_ALLOWED_CLIENTS must contain at least one client"
        );
    }

    return {
        issuer: environment.KEYCLOAK_ISSUER_URL,
        jwksUrl: environment.KEYCLOAK_JWKS_URL,
        audience: environment.KEYCLOAK_AUDIENCE,
        allowedClients
    };
}
