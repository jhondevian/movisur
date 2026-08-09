ALTER TABLE "creator_access_requests"
ADD COLUMN "public_name" VARCHAR(120) NOT NULL DEFAULT 'Creador Movisur',
ADD COLUMN "country" VARCHAR(80) NOT NULL DEFAULT 'Sin pais',
ADD COLUMN "specialty" VARCHAR(160),
ADD COLUMN "whatsapp" VARCHAR(40),
ADD COLUMN "image_url" VARCHAR(255);

ALTER TABLE "creator_access_requests"
ALTER COLUMN "public_name" DROP DEFAULT,
ALTER COLUMN "country" DROP DEFAULT;
