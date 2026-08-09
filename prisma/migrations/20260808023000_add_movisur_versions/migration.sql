CREATE TYPE "VersionPlatform" AS ENUM ('android', 'ios', 'windows', 'macos', 'web');

CREATE TYPE "VersionReleaseType" AS ENUM ('stable', 'beta', 'alpha');

CREATE TYPE "VersionDistribution" AS ENUM ('url', 'file');

CREATE TABLE "movisur_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "version" VARCHAR(40) NOT NULL,
  "build_number" INTEGER NOT NULL,
  "platform" "VersionPlatform" NOT NULL DEFAULT 'android',
  "release_type" "VersionReleaseType" NOT NULL DEFAULT 'stable',
  "distribution" "VersionDistribution" NOT NULL DEFAULT 'url',
  "download_url" TEXT NOT NULL,
  "file_name" VARCHAR(255),
  "file_size" INTEGER,
  "changelog" TEXT,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "force_update" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_versions_platform_build_key" ON "movisur_versions"("platform", "build_number");

CREATE INDEX "movisur_versions_public_idx" ON "movisur_versions"("platform", "is_active", "created_at");
