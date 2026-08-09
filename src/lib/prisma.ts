import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient & {
    movisurVersion?: unknown;
    movisurSaleSettings?: unknown;
    movisurPaymentMethod?: unknown;
    creatorPaymentMethod?: unknown;
    movisurSalePlan?: unknown;
    movisurPlanIncludedItem?: unknown;
    movisurBrandCategory?: unknown;
    movisurProductFile?: unknown;
    movisurProductFileRevision?: unknown;
    movisurProductFileReview?: unknown;
    creatorVendorReview?: unknown;
    movisurProductFileDownload?: unknown;
    creatorLicenseProduct?: unknown;
    creatorLicensePlan?: unknown;
    creatorRentalTool?: unknown;
    creatorRentalPlan?: unknown;
    creatorLicenseOffer?: unknown;
    creatorRentalOffer?: unknown;
    creatorLicenseAccount?: unknown;
    creatorRentalAccount?: unknown;
    creatorAccessRequest?: unknown;
    adminNotification?: unknown;
  };
  prismaSchemaVersion?: string;
};

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prismaSchemaVersion = "creator-access-profile-v1";
const cachedPrisma = globalForPrisma.prisma;
const shouldReuseCachedPrisma =
  cachedPrisma &&
  "movisurVersion" in cachedPrisma &&
  "movisurSaleSettings" in cachedPrisma &&
  "movisurPaymentMethod" in cachedPrisma &&
  "creatorPaymentMethod" in cachedPrisma &&
  "movisurSalePlan" in cachedPrisma &&
  "movisurPlanIncludedItem" in cachedPrisma &&
  "movisurBrandCategory" in cachedPrisma &&
  "movisurProductFile" in cachedPrisma &&
  "movisurProductFileRevision" in cachedPrisma &&
  "movisurProductFileReview" in cachedPrisma &&
  "creatorVendorReview" in cachedPrisma &&
  "movisurProductFileDownload" in cachedPrisma &&
  "creatorLicenseProduct" in cachedPrisma &&
  "creatorLicensePlan" in cachedPrisma &&
  "creatorRentalTool" in cachedPrisma &&
  "creatorRentalPlan" in cachedPrisma &&
  "creatorLicenseOffer" in cachedPrisma &&
  "creatorRentalOffer" in cachedPrisma &&
  "creatorLicenseAccount" in cachedPrisma &&
  "creatorRentalAccount" in cachedPrisma &&
  "creatorAccessRequest" in cachedPrisma &&
  "adminNotification" in cachedPrisma &&
  globalForPrisma.prismaSchemaVersion === prismaSchemaVersion;

export const prisma =
  shouldReuseCachedPrisma
    ? cachedPrisma
    : new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = prismaSchemaVersion;
}
