ALTER TABLE "movisur_brand_categories"
ADD COLUMN "show_on_home" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "movisur_device_models" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "category_id" UUID NOT NULL,
  "name" VARCHAR(140) NOT NULL,
  "code" VARCHAR(80),
  "year" INTEGER,
  "details" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "movisur_device_models_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_device_models_category_name_year_key"
ON "movisur_device_models"("category_id", "name", "year");

CREATE INDEX "movisur_device_models_category_idx"
ON "movisur_device_models"("category_id", "is_active", "sort_order");

ALTER TABLE "movisur_device_models"
ADD CONSTRAINT "movisur_device_models_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "movisur_brand_categories"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movisur_product_files"
ADD COLUMN "device_model_id" UUID,
ADD COLUMN "firmware_year" INTEGER,
ADD COLUMN "firmware_region" VARCHAR(40),
ADD COLUMN "firmware_build" VARCHAR(80),
ADD COLUMN "android_version" VARCHAR(40),
ADD COLUMN "binary_version" VARCHAR(40);

CREATE INDEX "movisur_product_files_device_model_idx"
ON "movisur_product_files"("device_model_id");

ALTER TABLE "movisur_product_files"
ADD CONSTRAINT "movisur_product_files_device_model_id_fkey"
FOREIGN KEY ("device_model_id") REFERENCES "movisur_device_models"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
