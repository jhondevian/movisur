ALTER TABLE "movisur_product_files"
  ADD COLUMN "deleted_at" TIMESTAMPTZ(6),
  ADD COLUMN "deleted_by_id" UUID;

CREATE INDEX "movisur_product_files_trash_idx"
  ON "movisur_product_files"("created_by_id", "deleted_at");
