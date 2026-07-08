export const commentSerializer = {
    item(comment: any,option: { includeInternalFlag?: boolean } = {} ){
        return {
            id: comment.id,
            ticketId: comment.ticketId,
            authorId: comment.authorId,
            content: comment.content,
            isInternalNote: option.includeInternalFlag
            ? comment.isInternalNote
            : undefined,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
        };
    },

    list (
        comments: any[],
        options: { includeInternalFlag?: boolean} = {},
    ) {
        return {
            data: comments.map((comment) => this.item(comment, options)),
        };
    },
};

