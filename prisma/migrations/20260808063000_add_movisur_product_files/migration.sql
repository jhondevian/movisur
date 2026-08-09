CREATE TABLE "movisur_product_files" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(140) NOT NULL,
  "slug" VARCHAR(160) NOT NULL,
  "category_id" UUID,
  "description" TEXT,
  "distribution" "VersionDistribution" NOT NULL DEFAULT 'url',
  "download_url" TEXT NOT NULL,
  "upload_key" VARCHAR(80),
  "file_name" VARCHAR(255),
  "file_size" INTEGER,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_for_sale" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_product_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_product_files_slug_key"
ON "movisur_product_files"("slug");

CREATE UNIQUE INDEX "movisur_product_files_upload_key_key"
ON "movisur_product_files"("upload_key");

CREATE INDEX "movisur_product_files_public_idx"
ON "movisur_product_files"("is_active", "is_for_sale", "sort_order");

CREATE INDEX "movisur_product_files_category_idx"
ON "movisur_product_files"("category_id");

ALTER TABLE "movisur_product_files"
ADD CONSTRAINT "movisur_product_files_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "movisur_brand_categories"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
