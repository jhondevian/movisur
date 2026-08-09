ALTER TABLE "movisur_product_files"
ADD COLUMN "created_by_id" UUID;

CREATE INDEX "movisur_product_files_creator_idx"
ON "movisur_product_files"("created_by_id");

ALTER TABLE "movisur_product_files"
ADD CONSTRAINT "movisur_product_files_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
