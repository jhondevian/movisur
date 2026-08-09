ALTER TABLE "creator_license_accounts"
  ADD COLUMN "assigned_expires_at" TIMESTAMPTZ(6);

ALTER TABLE "creator_rental_accounts"
  ADD COLUMN "assigned_expires_at" TIMESTAMPTZ(6);

CREATE INDEX "creator_license_accounts_offer_expiration_idx"
  ON "creator_license_accounts"("offer_id", "assigned_expires_at");

CREATE INDEX "creator_rental_accounts_offer_expiration_idx"
  ON "creator_rental_accounts"("offer_id", "assigned_expires_at");
