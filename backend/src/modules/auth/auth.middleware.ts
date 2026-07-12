import {
    Request,
    RequestHandler,
    Response
} from "express";
import type { AccessTokenVerifier } from ".";
import { verifyAccessToken } from ".";

function extractBearerToken (
    request: Request
): string | null {
    const authorization = request.header("authorization");

    if(!authorization){
        return null;
    }

    const match = /^Bearer\s+(\S+)$/i.exec(
        authorization.trim(),
    );

    return match?.[1] ?? null
}

function sendAuthenticationRequired(
    response: Response,
): void {
    response.setHeader(
        "WWW-Authenticate",
        'Bearer realm="ticketflow"',
    );

    response.status(401).json({
        error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "A valid bearer access token is required.",
        },
    });
}

function sendInvalidAccessToken(
  response: Response,
): void {
  response.setHeader(
    "WWW-Authenticate",
    'Bearer realm="ticketflow", error="invalid_token"',
  );

  response.status(401).json({
    error: {
      code: "INVALID_ACCESS_TOKEN",
      message: "The access token is invalid or expired.",
    },
  });
}

export function createAuthenticationMiddleware(
  verifier: AccessTokenVerifier,
): RequestHandler {
  return async (
    request,
    response,
    next,
  ): Promise<void> => {
    const token = extractBearerToken(request);

    if (!token) {
      sendAuthenticationRequired(response);
      return;
    }

    try {
      const principal = await verifier(token);

      request.auth = principal;

      next();
    } catch {
      /*
       * Do not expose JWT verification details to clients.
       * Errors such as invalid signature, issuer, audience,
       * expiration or malformed claims all produce the same
       * safe response.
       */
      sendInvalidAccessToken(response);
    }
  };
}

/**
 * Default middleware using the real Keycloak verifier.
 */
export const authenticate =
  createAuthenticationMiddleware(
    verifyAccessToken,
  );