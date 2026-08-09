CREATE TYPE "CreatorRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "creator_access_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "status" "CreatorRequestStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "creator_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "creator_access_requests_status_idx" ON "creator_access_requests"("status", "created_at");
CREATE INDEX "creator_access_requests_user_status_idx" ON "creator_access_requests"("user_id", "status");

ALTER TABLE "creator_access_requests"
ADD CONSTRAINT "creator_access_requests_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_access_requests"
ADD CONSTRAINT "creator_access_requests_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
