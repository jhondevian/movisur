CREATE TABLE "movisur_brand_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "description" TEXT,
  "image_url" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_brand_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_brand_categories_code_key"
ON "movisur_brand_categories"("code");

CREATE INDEX "movisur_brand_categories_public_idx"
ON "movisur_brand_categories"("is_active", "sort_order");
