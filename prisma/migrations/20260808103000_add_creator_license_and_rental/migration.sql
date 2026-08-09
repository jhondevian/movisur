CREATE TABLE "creator_license_products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "description" TEXT,
  "image_url" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "creator_license_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creator_license_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "duration_months" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "creator_license_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creator_rental_tools" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "description" TEXT,
  "image_url" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "creator_rental_tools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creator_rental_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tool_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "duration_months" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "creator_rental_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creator_license_products_slug_key" ON "creator_license_products"("slug");
CREATE INDEX "creator_license_products_public_idx" ON "creator_license_products"("is_active", "sort_order");
CREATE INDEX "creator_license_plans_product_idx" ON "creator_license_plans"("product_id", "is_active", "sort_order");
CREATE UNIQUE INDEX "creator_rental_tools_slug_key" ON "creator_rental_tools"("slug");
CREATE INDEX "creator_rental_tools_public_idx" ON "creator_rental_tools"("is_active", "sort_order");
CREATE INDEX "creator_rental_plans_tool_idx" ON "creator_rental_plans"("tool_id", "is_active", "sort_order");

ALTER TABLE "creator_license_plans"
  ADD CONSTRAINT "creator_license_plans_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "creator_license_products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_rental_plans"
  ADD CONSTRAINT "creator_rental_plans_tool_id_fkey"
  FOREIGN KEY ("tool_id") REFERENCES "creator_rental_tools"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
