CREATE TABLE "creator_license_offers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "creator_license_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creator_rental_offers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "tool_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "creator_rental_offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creator_license_offers_creator_plan_key"
  ON "creator_license_offers"("creator_id", "plan_id");
CREATE INDEX "creator_license_offers_creator_idx"
  ON "creator_license_offers"("creator_id", "is_active");
CREATE INDEX "creator_license_offers_product_idx"
  ON "creator_license_offers"("product_id", "is_active");

CREATE UNIQUE INDEX "creator_rental_offers_creator_plan_key"
  ON "creator_rental_offers"("creator_id", "plan_id");
CREATE INDEX "creator_rental_offers_creator_idx"
  ON "creator_rental_offers"("creator_id", "is_active");
CREATE INDEX "creator_rental_offers_tool_idx"
  ON "creator_rental_offers"("tool_id", "is_active");

ALTER TABLE "creator_license_offers"
  ADD CONSTRAINT "creator_license_offers_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_license_offers"
  ADD CONSTRAINT "creator_license_offers_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "creator_license_products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_license_offers"
  ADD CONSTRAINT "creator_license_offers_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "creator_license_plans"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_rental_offers"
  ADD CONSTRAINT "creator_rental_offers_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_rental_offers"
  ADD CONSTRAINT "creator_rental_offers_tool_id_fkey"
  FOREIGN KEY ("tool_id") REFERENCES "creator_rental_tools"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_rental_offers"
  ADD CONSTRAINT "creator_rental_offers_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "creator_rental_plans"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
