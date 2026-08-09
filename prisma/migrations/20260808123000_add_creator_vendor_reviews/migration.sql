CREATE TABLE "creator_vendor_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "reviewer_id" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "creator_vendor_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creator_vendor_reviews_user_key"
  ON "creator_vendor_reviews"("creator_id", "reviewer_id");

CREATE INDEX "creator_vendor_reviews_creator_idx"
  ON "creator_vendor_reviews"("creator_id");

CREATE INDEX "creator_vendor_reviews_reviewer_idx"
  ON "creator_vendor_reviews"("reviewer_id");

ALTER TABLE "creator_vendor_reviews"
  ADD CONSTRAINT "creator_vendor_reviews_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_vendor_reviews"
  ADD CONSTRAINT "creator_vendor_reviews_reviewer_id_fkey"
  FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
