CREATE TYPE "PaymentMethodCode" AS ENUM ('paypal', 'binance', 'mercadopago', 'transferencia');

CREATE TABLE "movisur_sale_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "product_name" VARCHAR(120) NOT NULL DEFAULT 'Movisur Tool',
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_sale_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movisur_payment_methods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" "PaymentMethodCode" NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "details" TEXT,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "movisur_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movisur_payment_methods_code_key" ON "movisur_payment_methods"("code");

INSERT INTO "movisur_sale_settings" ("id", "product_name", "price", "currency", "description", "is_active", "updated_at")
VALUES ('default', 'Movisur Tool', 0, 'USD', 'Licencia de acceso a Movisur Tool.', true, CURRENT_TIMESTAMP);

INSERT INTO "movisur_payment_methods" ("code", "name", "details", "is_enabled", "sort_order", "updated_at")
VALUES
  ('paypal', 'PayPal', '', false, 1, CURRENT_TIMESTAMP),
  ('binance', 'Binance', '', false, 2, CURRENT_TIMESTAMP),
  ('mercadopago', 'MercadoPago', '', false, 3, CURRENT_TIMESTAMP),
  ('transferencia', 'Transferencia', '', false, 4, CURRENT_TIMESTAMP);
