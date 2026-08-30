ALTER TABLE "admin_notifications"
ADD COLUMN "archived_at" TIMESTAMPTZ(6),
ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

CREATE INDEX "admin_notifications_visible_idx"
ON "admin_notifications"("recipient_user_id", "archived_at", "deleted_at", "created_at");
