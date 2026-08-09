CREATE TABLE "movisur_product_file_downloads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_file_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "download_count" INTEGER NOT NULL DEFAULT 1,
  "first_downloaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_downloaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "movisur_product_file_downloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_product_file_downloads_user_key"
ON "movisur_product_file_downloads"("product_file_id", "user_id");

CREATE INDEX "movisur_product_file_downloads_product_idx"
ON "movisur_product_file_downloads"("product_file_id");

CREATE INDEX "movisur_product_file_downloads_user_idx"
ON "movisur_product_file_downloads"("user_id");

ALTER TABLE "movisur_product_file_downloads"
ADD CONSTRAINT "movisur_product_file_downloads_product_file_id_fkey"
FOREIGN KEY ("product_file_id") REFERENCES "movisur_product_files"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movisur_product_file_downloads"
ADD CONSTRAINT "movisur_product_file_downloads_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
