CREATE TABLE "movisur_product_file_revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_file_id" UUID NOT NULL,
  "version_number" INTEGER NOT NULL,
  "distribution" "VersionDistribution" NOT NULL DEFAULT 'url',
  "download_url" TEXT NOT NULL,
  "file_type" VARCHAR(20) NOT NULL DEFAULT 'zip',
  "file_mime_type" VARCHAR(120),
  "file_name" VARCHAR(255),
  "file_size" INTEGER,
  "is_current" BOOLEAN NOT NULL DEFAULT false,
  "created_by_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "movisur_product_file_revisions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "movisur_product_file_revisions" (
  "product_file_id",
  "version_number",
  "distribution",
  "download_url",
  "file_type",
  "file_mime_type",
  "file_name",
  "file_size",
  "is_current",
  "created_by_id",
  "created_at"
)
SELECT
  "id",
  1,
  "distribution",
  "download_url",
  "file_type",
  "file_mime_type",
  "file_name",
  "file_size",
  true,
  "created_by_id",
  "created_at"
FROM "movisur_product_files";

CREATE UNIQUE INDEX "movisur_product_file_revisions_version_key"
ON "movisur_product_file_revisions"("product_file_id", "version_number");

CREATE INDEX "movisur_product_file_revisions_current_idx"
ON "movisur_product_file_revisions"("product_file_id", "is_current", "version_number");

CREATE INDEX "movisur_product_file_revisions_creator_idx"
ON "movisur_product_file_revisions"("created_by_id");

ALTER TABLE "movisur_product_file_revisions"
ADD CONSTRAINT "movisur_product_file_revisions_product_file_id_fkey"
FOREIGN KEY ("product_file_id") REFERENCES "movisur_product_files"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movisur_product_file_revisions"
ADD CONSTRAINT "movisur_product_file_revisions_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
