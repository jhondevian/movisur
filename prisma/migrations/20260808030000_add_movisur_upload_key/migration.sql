ALTER TABLE "movisur_versions" ADD COLUMN "upload_key" VARCHAR(80);

CREATE UNIQUE INDEX "movisur_versions_upload_key_key" ON "movisur_versions"("upload_key");
