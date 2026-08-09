ALTER TABLE "movisur_versions"
ADD COLUMN "is_sale_version" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "movisur_versions_sale_download_idx"
ON "movisur_versions"("is_sale_version", "is_active", "created_at");
