import { requireAdminUser } from "@/lib/admin-auth";
import { ensureMovisurCommerceSettings } from "@/lib/movisur-commerce";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type PlanPayload = {
  name?: string;
  durationMonths?: number;
  price?: number;
  isActive?: boolean;
  includedItems?: string[];
};

function parsePlans(value: string) {
  if (!value) return [];

  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed as PlanPayload[];
}

export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const settings = await ensureMovisurCommerceSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const productName = getString(formData, "productName") || "Movisur Tool";
  const currency = getString(formData, "currency") || "USD";
  const description = getString(formData, "description");
  const isActive = getString(formData, "isActive") === "true";
  const plans = parsePlans(getString(formData, "plans"));

  if (plans.length === 0) {
    return NextResponse.json(
      { message: "Agrega al menos un plan de venta." },
      { status: 400 }
    );
  }

  let normalizedPlans: {
    name: string;
    durationMonths: number;
    price: number;
    isActive: boolean;
    sortOrder: number;
    includedItems: string[];
  }[];

  try {
    normalizedPlans = plans.map((plan, index) => {
      const name = plan.name?.trim() || `Plan ${index + 1}`;
      const durationMonths = Number(plan.durationMonths);
      const price = Number(plan.price);

      if (!Number.isInteger(durationMonths) || durationMonths < 1) {
        throw new Error("Cada plan necesita una duracion valida.");
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Cada plan necesita un precio valido.");
      }

      return {
        name,
        durationMonths,
        price,
        isActive: Boolean(plan.isActive),
        sortOrder: index + 1,
        includedItems: (plan.includedItems ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
      };
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Plan invalido." },
      { status: 400 }
    );
  }

  const saleSettings = await prisma.$transaction(async (tx) => {
    const settings = await tx.movisurSaleSettings.upsert({
      where: { id: "default" },
      update: {
        productName,
        price: normalizedPlans[0]?.price ?? 0,
        currency,
        description,
        isActive,
      },
      create: {
        id: "default",
        productName,
        price: normalizedPlans[0]?.price ?? 0,
        currency,
        description,
        isActive,
      },
    });

    await tx.movisurPlanIncludedItem.deleteMany();
    await tx.movisurSalePlan.deleteMany();

    for (const plan of normalizedPlans) {
      await tx.movisurSalePlan.create({
        data: {
          name: plan.name,
          durationMonths: plan.durationMonths,
          price: plan.price,
          isActive: plan.isActive,
          sortOrder: plan.sortOrder,
          includedItems: {
            create: plan.includedItems.map((item, itemIndex) => ({
              name: item,
              sortOrder: itemIndex + 1,
            })),
          },
        },
      });
    }

    return settings;
  });

  return NextResponse.json({ saleSettings });
}
