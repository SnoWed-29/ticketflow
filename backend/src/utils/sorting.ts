export type SortOrder = "asc" | "desc" ;

export const buildOrderBy = (
    sortBy: string,
    sortOrder: SortOrder
) => {
    return {
        [sortBy]: sortOrder,
    }
}