import { bumpCacheNamespaceVersion } from "./cache";
import { CACHE_NAMESPACES } from "./cache-keys";

export async function invalidateCategoryCache(): Promise<void>{
    await Promise.all([
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.CATEGORIES,
        ),
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.TICKET_STATS,
        ),
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.TICKET_DETAILS,
        ),
    ]);
}

export async function invalidateTicketCache(): Promise<void>{
    await Promise.all([
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.TICKET_STATS,
        ),
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.TICKET_DETAILS,
        ),
    ]);
}

export async function invalidateCommentCache(): Promise<void>{
    await Promise.all([
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.TICKET_COMMENTS,
        ),
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.TICKET_DETAILS,
        ),
    ]);
}

export async function invalidateRoleLookupCache(): Promise<void>{
    await Promise.all([
        bumpCacheNamespaceVersion(
            CACHE_NAMESPACES.ROLE_LOOKUPS,
        )
    ]);
}
