import {
  getBoolean,
  getString,
  parsePlans,
  saveAdminMovisurImage,
} from "@/lib/admin-movisur-items";
import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const sortOrder = Number(getString(formData, "sortOrder") || 0);
  const isActive = getBoolean(formData, "isActive");
  const plans = parsePlans(getString(formData, "plans"));
  const image = formData.get("image");

  if (!name) {
    return NextResponse.json(
      { message: "El nombre de la licencia es obligatorio." },
      { status: 400 }
    );
  }

  try {
    const imageUrl =
      image instanceof File && image.size > 0
        ? await saveAdminMovisurImage(image, "creator-licenses")
        : undefined;

    const item = await prisma.$transaction(async (tx) => {
      const existingPlans = await tx.creatorLicensePlan.findMany({
        where: { productId: id },
        select: { id: true },
      });
      const existingPlanIds = new Set(existingPlans.map((plan) => plan.id));
      const incomingPlanIds = new Set(
        plans
          .map((plan) => plan.id)
          .filter((planId): planId is string => Boolean(planId))
      );

      await tx.creatorLicenseProduct.update({
        where: { id },
        data: {
          name,
          description,
          sortOrder,
          isActive,
          ...(imageUrl ? { imageUrl } : {}),
        },
      });

      await Promise.all(
        plans.map((plan) => {
          const { id: planId, ...data } = plan;

          if (planId && existingPlanIds.has(planId)) {
            return tx.creatorLicensePlan.update({
              where: { id: planId },
              data,
            });
          }

          return tx.creatorLicensePlan.create({
            data: {
              ...data,
              productId: id,
            },
          });
        })
      );

      const removedPlanIds = [...existingPlanIds].filter(
        (planId) => !incomingPlanIds.has(planId)
      );

      if (removedPlanIds.length > 0) {
        await tx.creatorLicensePlan.updateMany({
          where: { id: { in: removedPlanIds }, productId: id },
          data: { isActive: false },
        });
      }

      return tx.creatorLicenseProduct.findUnique({
        where: { id },
        include: { plans: true },
      });
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la licencia.",
      },
      { status: 500 }
    );
  }
}
