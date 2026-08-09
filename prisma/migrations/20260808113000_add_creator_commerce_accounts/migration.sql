-- Create creator-managed account inventories for license and rental offers.
CREATE TABLE "creator_license_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "offer_id" UUID NOT NULL,
  "username" VARCHAR(180) NOT NULL,
  "password" VARCHAR(180) NOT NULL,
  "note" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "assigned_to_id" UUID,
  "purchase_notification_id" UUID,
  "assigned_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "creator_license_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creator_rental_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "offer_id" UUID NOT NULL,
  "username" VARCHAR(180) NOT NULL,
  "password" VARCHAR(180) NOT NULL,
  "note" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "assigned_to_id" UUID,
  "purchase_notification_id" UUID,
  "assigned_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "creator_rental_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "creator_license_accounts_creator_idx" ON "creator_license_accounts"("creator_id", "is_active");
CREATE INDEX "creator_license_accounts_offer_assignment_idx" ON "creator_license_accounts"("offer_id", "assigned_to_id");
CREATE INDEX "creator_license_accounts_buyer_idx" ON "creator_license_accounts"("assigned_to_id");

CREATE INDEX "creator_rental_accounts_creator_idx" ON "creator_rental_accounts"("creator_id", "is_active");
CREATE INDEX "creator_rental_accounts_offer_assignment_idx" ON "creator_rental_accounts"("offer_id", "assigned_to_id");
CREATE INDEX "creator_rental_accounts_buyer_idx" ON "creator_rental_accounts"("assigned_to_id");

ALTER TABLE "creator_license_accounts"
  ADD CONSTRAINT "creator_license_accounts_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_license_accounts"
  ADD CONSTRAINT "creator_license_accounts_assigned_to_id_fkey"
  FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creator_license_accounts"
  ADD CONSTRAINT "creator_license_accounts_offer_id_fkey"
  FOREIGN KEY ("offer_id") REFERENCES "creator_license_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_rental_accounts"
  ADD CONSTRAINT "creator_rental_accounts_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_rental_accounts"
  ADD CONSTRAINT "creator_rental_accounts_assigned_to_id_fkey"
  FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creator_rental_accounts"
  ADD CONSTRAINT "creator_rental_accounts_offer_id_fkey"
  FOREIGN KEY ("offer_id") REFERENCES "creator_rental_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
