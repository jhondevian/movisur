import { ensureMovisurCommerceSettings } from "@/lib/movisur-commerce";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseDetails(details: string | null) {
  if (!details) return {};

  try {
    return JSON.parse(details) as Record<string, string>;
  } catch {
    return { notes: details };
  }
}

export async function GET() {
  const { saleSettings, salePlans, paymentMethods } =
    await ensureMovisurCommerceSettings();

  return NextResponse.json({
    settings: {
      productName: saleSettings.productName,
      currency: saleSettings.currency,
      description: saleSettings.description,
      isActive: saleSettings.isActive,
    },
    plans: salePlans
      .filter((plan) => plan.isActive)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        durationMonths: plan.durationMonths,
        price: plan.price.toString(),
        includedItems: plan.includedItems.map((item) => item.name),
      })),
    paymentMethods: paymentMethods
      .filter((method) => method.isEnabled)
      .map((method) => ({
        code: method.code,
        name: method.name,
        config: parseDetails(method.details),
      })),
  });
}
