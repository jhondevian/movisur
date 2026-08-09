ALTER TABLE "admin_notifications"
  ADD COLUMN "recipient_user_id" UUID;

CREATE TABLE "creator_payment_methods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "code" "PaymentMethodCode" NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "details" TEXT,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "creator_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creator_payment_methods_creator_code_key"
  ON "creator_payment_methods"("creator_id", "code");

CREATE INDEX "creator_payment_methods_creator_idx"
  ON "creator_payment_methods"("creator_id", "is_enabled");

CREATE INDEX "admin_notifications_recipient_idx"
  ON "admin_notifications"("recipient_user_id", "is_read", "created_at");

ALTER TABLE "creator_payment_methods"
  ADD CONSTRAINT "creator_payment_methods_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_notifications"
  ADD CONSTRAINT "admin_notifications_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
