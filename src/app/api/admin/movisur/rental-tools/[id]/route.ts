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
  const showInFrontend = getBoolean(formData, "showInFrontend");
  const plans = parsePlans(getString(formData, "plans"));
  const image = formData.get("image");

  if (!name) {
    return NextResponse.json(
      { message: "El nombre de la tool es obligatorio." },
      { status: 400 }
    );
  }

  try {
    const imageUrl =
      image instanceof File && image.size > 0
        ? await saveAdminMovisurImage(image, "rental-tools")
        : undefined;

    const item = await prisma.$transaction(async (tx) => {
      const existingPlans = await tx.creatorRentalPlan.findMany({
        where: { toolId: id },
        select: { id: true },
      });
      const existingPlanIds = new Set(existingPlans.map((plan) => plan.id));
      const incomingPlanIds = new Set(
        plans
          .map((plan) => plan.id)
          .filter((planId): planId is string => Boolean(planId))
      );

      await tx.creatorRentalTool.update({
        where: { id },
        data: {
          name,
          description,
          sortOrder,
          isActive,
          showInFrontend,
          ...(imageUrl ? { imageUrl } : {}),
        },
      });

      await Promise.all(
        plans.map((plan) => {
          const { id: planId, ...data } = plan;

          if (planId && existingPlanIds.has(planId)) {
            return tx.creatorRentalPlan.update({
              where: { id: planId },
              data,
            });
          }

          return tx.creatorRentalPlan.create({
            data: {
              ...data,
              toolId: id,
            },
          });
        })
      );

      const removedPlanIds = [...existingPlanIds].filter(
        (planId) => !incomingPlanIds.has(planId)
      );

      if (removedPlanIds.length > 0) {
        await tx.creatorRentalPlan.updateMany({
          where: { id: { in: removedPlanIds }, toolId: id },
          data: { isActive: false },
        });
      }

      return tx.creatorRentalTool.findUnique({
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
            : "No se pudo actualizar la tool.",
      },
      { status: 500 }
    );
  }
}
