CREATE TABLE "icloud_check_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "api_base_url" VARCHAR(255) NOT NULL DEFAULT 'https://api.ifreeicloud.co.uk',
  "api_key_encrypted" TEXT,
  "service_id" VARCHAR(40),
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "last_connection_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "icloud_check_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "icloud_check_lookups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "identifier" VARCHAR(80) NOT NULL,
  "service_id" VARCHAR(40),
  "status" VARCHAR(40) NOT NULL DEFAULT 'completed',
  "response" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "icloud_check_lookups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "icloud_check_lookups_identifier_idx"
ON "icloud_check_lookups"("identifier", "created_at");
