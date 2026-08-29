ALTER TABLE "creator_rental_tools"
  ADD COLUMN "show_in_frontend" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "creator_rental_tools_frontend_idx"
  ON "creator_rental_tools"("show_in_frontend", "is_active", "sort_order");
