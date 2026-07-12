import { boolean, z } from "zod";

import type { KeycloakAuthConfig } from "./auth.types";

const keycloakEnviromentSchema = z.object({
    KEYCLOAK_ISSUER: z
        .string()
        .url("KEYCLOACK_ISSUER must be a valid URL"),

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
    const enviroment = keycloakEnviromentSchema.parse(process.env);

    const allowedClients = enviroment.KEYCLOAK_ALLOWED_CLIENTS
        .split(",")
        .map((client) => client.trim())
        .filter(boolean);

    if(allowedClients.length === 0 ) {
        throw new Error(
            "KEYCLOAK_ALLOWED_CLIENTS must contain at least one client"
        );
    }

    return {
        issuer: enviroment.KEYCLOAK_ISSUER,
        jwksUrl: enviroment.KEYCLOAK_JWKS_URL,
        audience: enviroment.KEYCLOAK_AUDIENCE,
        allowedClients
    };
}