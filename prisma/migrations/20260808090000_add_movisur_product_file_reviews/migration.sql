CREATE TABLE "movisur_product_file_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_file_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "uploader_id" UUID,
  "rating" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_product_file_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "movisur_product_file_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE UNIQUE INDEX "movisur_product_file_reviews_user_key"
ON "movisur_product_file_reviews"("product_file_id", "user_id");

CREATE INDEX "movisur_product_file_reviews_product_idx"
ON "movisur_product_file_reviews"("product_file_id");

CREATE INDEX "movisur_product_file_reviews_uploader_idx"
ON "movisur_product_file_reviews"("uploader_id");

ALTER TABLE "movisur_product_file_reviews"
ADD CONSTRAINT "movisur_product_file_reviews_product_file_id_fkey"
FOREIGN KEY ("product_file_id") REFERENCES "movisur_product_files"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movisur_product_file_reviews"
ADD CONSTRAINT "movisur_product_file_reviews_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movisur_product_file_reviews"
ADD CONSTRAINT "movisur_product_file_reviews_uploader_id_fkey"
FOREIGN KEY ("uploader_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
