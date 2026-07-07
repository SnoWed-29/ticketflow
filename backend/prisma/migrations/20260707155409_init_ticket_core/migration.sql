-- DropIndex
DROP INDEX "attachments_ticket_id_idx";

-- DropIndex
DROP INDEX "comments_author_id_idx";

-- DropIndex
DROP INDEX "comments_ticket_id_idx";

-- DropIndex
DROP INDEX "notifications_is_read_idx";

-- DropIndex
DROP INDEX "notifications_ticket_id_idx";

-- DropIndex
DROP INDEX "notifications_user_id_idx";

-- DropIndex
DROP INDEX "ticket_events_actor_id_idx";

-- DropIndex
DROP INDEX "ticket_events_ticket_id_idx";

-- DropIndex
DROP INDEX "ticket_events_type_idx";

-- CreateIndex
CREATE INDEX "idx_attachments_ticket_created_at" ON "attachments"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_categories_is_active" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "idx_comments_ticket_created_at" ON "comments"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_comments_author_created_at" ON "comments"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read_created_at" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_user_created_at" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_ticket_created_at" ON "notifications"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_ticket_events_ticket_created_at" ON "ticket_events"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_ticket_events_actor_created_at" ON "ticket_events"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_ticket_events_type_created_at" ON "ticket_events"("type", "created_at");

-- CreateIndex
CREATE INDEX "idx_tickets_status_priority" ON "tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "idx_tickets_status_created_at" ON "tickets"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_tickets_category_status" ON "tickets"("category_id", "status");

-- CreateIndex
CREATE INDEX "idx_tickets_requester_status" ON "tickets"("requester_id", "status");

-- CreateIndex
CREATE INDEX "idx_tickets_assignee_status" ON "tickets"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "idx_tickets_created_at" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "idx_tickets_updated_at" ON "tickets"("updated_at");

-- RenameIndex
ALTER INDEX "attachments_comment_id_idx" RENAME TO "idx_attachments_comment_id";

-- RenameIndex
ALTER INDEX "attachments_uploaded_by_id_idx" RENAME TO "idx_attachments_uploaded_by_id";

-- RenameIndex
ALTER INDEX "tickets_assignee_id_idx" RENAME TO "idx_tickets_assignee_id";

-- RenameIndex
ALTER INDEX "tickets_category_id_idx" RENAME TO "idx_tickets_category_id";

-- RenameIndex
ALTER INDEX "tickets_priority_idx" RENAME TO "idx_tickets_priority";

-- RenameIndex
ALTER INDEX "tickets_requester_id_idx" RENAME TO "idx_tickets_requester_id";

-- RenameIndex
ALTER INDEX "tickets_status_idx" RENAME TO "idx_tickets_status";
