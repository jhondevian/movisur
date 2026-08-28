ALTER TABLE "movisur_versions"
ALTER COLUMN "file_size" TYPE BIGINT;

ALTER TABLE "movisur_product_files"
ALTER COLUMN "file_size" TYPE BIGINT;

ALTER TABLE "movisur_product_file_revisions"
ALTER COLUMN "file_size" TYPE BIGINT;

ALTER TABLE "telegram_files"
ALTER COLUMN "file_size" TYPE BIGINT;
