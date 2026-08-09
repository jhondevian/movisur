CREATE TABLE "movisur_sale_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "duration_months" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_sale_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movisur_plan_included_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "movisur_plan_included_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movisur_plan_included_items"
ADD CONSTRAINT "movisur_plan_included_items_plan_id_fkey"
FOREIGN KEY ("plan_id") REFERENCES "movisur_sale_plans"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "movisur_sale_plans" ("name", "duration_months", "price", "is_active", "sort_order", "updated_at")
VALUES
  ('1 mes', 1, 0, true, 1, CURRENT_TIMESTAMP),
  ('2 meses', 2, 0, true, 2, CURRENT_TIMESTAMP),
  ('6 meses', 6, 0, true, 3, CURRENT_TIMESTAMP),
  ('1 año', 12, 0, true, 4, CURRENT_TIMESTAMP);
