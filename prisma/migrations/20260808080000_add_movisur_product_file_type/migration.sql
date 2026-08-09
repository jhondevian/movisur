ALTER TABLE "movisur_product_files"
ADD COLUMN "file_type" VARCHAR(20) NOT NULL DEFAULT 'zip',
ADD COLUMN "file_mime_type" VARCHAR(120);
