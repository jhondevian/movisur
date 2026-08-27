CREATE TABLE "telegram_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "bot_username" VARCHAR(120),
  "bot_token_encrypted" TEXT,
  "webhook_secret" VARCHAR(160),
  "allowed_chat_ids" TEXT,
  "auto_import" BOOLEAN NOT NULL DEFAULT false,
  "last_webhook_set_at" TIMESTAMPTZ(6),
  "last_connection_check_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "telegram_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "telegram_files" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "chat_id" VARCHAR(80) NOT NULL,
  "chat_title" VARCHAR(180),
  "message_id" INTEGER NOT NULL,
  "file_id" TEXT NOT NULL,
  "file_unique_id" VARCHAR(180) NOT NULL,
  "file_name" VARCHAR(255),
  "file_mime_type" VARCHAR(120),
  "file_size" INTEGER,
  "file_kind" VARCHAR(40) NOT NULL DEFAULT 'document',
  "caption" TEXT,
  "status" VARCHAR(40) NOT NULL DEFAULT 'pending',
  "imported_file_id" UUID,
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "imported_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "telegram_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telegram_files_message_file_key" ON "telegram_files"("chat_id", "message_id", "file_unique_id");
CREATE INDEX "telegram_files_status_idx" ON "telegram_files"("status", "received_at");
CREATE INDEX "telegram_files_chat_idx" ON "telegram_files"("chat_id", "received_at");
