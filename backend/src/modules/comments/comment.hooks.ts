type CommentHookPayload = {
    ticketId: string;
    commentId: string;
    actorId: string;
    isInternalNote: boolean;
}
// Future real-time websocket event hook.
export const commentHook = {
    async afterCommentCreated(payload: CommentHookPayload){
        void payload;
    },

    async afterCommentUpdated(payload: CommentHookPayload){
        void payload;
    },

    async afterCommentDeleted(payload: CommentHookPayload){
        void payload;
    },
}