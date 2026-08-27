ALTER TABLE "movisur_brand_categories"
ADD COLUMN "category_type" VARCHAR(40) NOT NULL DEFAULT 'brand';

CREATE INDEX "movisur_brand_categories_type_public_idx"
ON "movisur_brand_categories"("category_type", "is_active", "sort_order");
