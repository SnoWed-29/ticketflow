export const CACHE_NAMESPACES = {
    CATEGORIES: "categories",
    TICKET_STATS: "ticket-stats",
    TICKET_DETAILS:"ticket-details",
    TICKET_COMMENTS: "ticket-comments" ,
    ROLE_LOOKUPS: "role-lookups"
} as const ;

export type CacheNamespace = ( typeof CACHE_NAMESPACES)[keyof typeof CACHE_NAMESPACES]

const PREFIX = "ticketflow";

export const cacheKeys = {
    version(namespace: CacheNamespace): string{
        return `${PREFIX}:cache-version:${namespace}`;
    },
    categoryList(version: number): string {
        return `${PREFIX}:cache:categories:v${version}:list`
    },
    ticketStats(
        version: number,
        identity = "global"
    ): string {
        return `${PREFIX}:cache:ticket-stats:v${version}:${identity}`
    },
    ticketDetails(version: number,ticketId: string): string {
        return `${PREFIX}:cache:ticket-details:v${version}:${ticketId}`
    },
    ticketComments(version: number,ticketId: string): string {
        return `${PREFIX}:cache:ticket-comments:v${version}:${ticketId}`;
    },

    roleLookup(version: number,userId: string): string {
        return `${PREFIX}:cache:role-lookups:v${version}:${userId}`
    },
}
