CREATE TABLE "mobile_push_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "platform" VARCHAR(40),
  "device_id" VARCHAR(160),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "mobile_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_push_tokens_token_key" ON "mobile_push_tokens"("token");
CREATE INDEX "mobile_push_tokens_user_active_idx" ON "mobile_push_tokens"("user_id", "is_active");
CREATE INDEX "mobile_push_tokens_token_idx" ON "mobile_push_tokens"("token");

ALTER TABLE "mobile_push_tokens"
  ADD CONSTRAINT "mobile_push_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
