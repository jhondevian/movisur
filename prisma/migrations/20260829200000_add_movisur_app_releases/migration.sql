CREATE TABLE "movisur_app_releases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "version" VARCHAR(40) NOT NULL,
  "build_number" INTEGER NOT NULL,
  "platform" "VersionPlatform" NOT NULL DEFAULT 'android',
  "release_type" "VersionReleaseType" NOT NULL DEFAULT 'stable',
  "distribution" "VersionDistribution" NOT NULL DEFAULT 'url',
  "download_url" TEXT NOT NULL,
  "upload_key" VARCHAR(80),
  "file_name" VARCHAR(255),
  "file_size" BIGINT,
  "changelog" TEXT,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "force_update" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "show_for_users" BOOLEAN NOT NULL DEFAULT true,
  "show_for_creators" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_app_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_app_releases_platform_build_key"
ON "movisur_app_releases"("platform", "build_number");

CREATE UNIQUE INDEX "movisur_app_releases_upload_key_key"
ON "movisur_app_releases"("upload_key");

CREATE INDEX "movisur_app_releases_public_idx"
ON "movisur_app_releases"("platform", "is_active", "show_for_users", "show_for_creators", "build_number");

CREATE INDEX "movisur_app_releases_creator_idx"
ON "movisur_app_releases"("created_by_id");

ALTER TABLE "movisur_app_releases"
ADD CONSTRAINT "movisur_app_releases_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
