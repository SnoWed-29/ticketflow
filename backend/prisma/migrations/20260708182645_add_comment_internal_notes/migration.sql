-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_internal_note" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_comments_ticket_internal_created_at" ON "comments"("ticket_id", "is_internal_note", "created_at");

-- CreateIndex
CREATE INDEX "idx_comments_deleted_at" ON "comments"("deleted_at");
