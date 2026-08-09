import CreatorCommerceOfferSettings from "@/components/movisur/CreatorCommerceOfferSettings";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alquiler creador | Movisur",
  description: "Tools disponibles para alquilar por horas",
};

export default async function CreadorAlquilerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/alquiler");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/alquiler");
  }

  const items = await prisma.creatorRentalTool.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      plans: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { durationMonths: "asc" }],
        include: {
          offers: {
            where: { creatorId: user.id },
            take: 1,
          },
        },
      },
    },
  });

  return (
    <CreatorCommerceOfferSettings
      title="Alquiler"
      description="Activa las tools que quieres alquilar y define tu precio por horas."
      emptyTitle="No hay alquileres disponibles"
      emptyDescription="Cuando el admin active tools de alquiler, apareceran aqui."
      durationLabel="horas"
      saveEndpoint="/api/creador/alquiler/offers"
      accountEndpoint="/api/creador/alquiler/accounts"
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        plans: item.plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          durationMonths: plan.durationMonths,
          basePrice: plan.price.toString(),
          currency: plan.currency,
          offerPrice: plan.offers[0]?.price.toString() ?? plan.price.toString(),
          offerCurrency: plan.offers[0]?.currency ?? plan.currency,
          offerActive: plan.offers[0]?.isActive ?? false,
        })),
      }))}
    />
  );
}
