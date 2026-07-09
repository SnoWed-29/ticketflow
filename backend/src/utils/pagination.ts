export type PaginationInput = {
    page: number;
    limit: number;
}

export const getPagination = ({ page, limit}: PaginationInput) => {
    return {
        skip: (page -1) * limit,
        take: limit,
    }
}

export const getPaginationMeta = ( input:{
    total: number,
    page: number,
    limit: number
}) => {
    return {
        total: input.total,
        page:  input.page,
        limit:  input.limit,
        totalPages: Math.ceil(input.total / input.limit)
    };
}