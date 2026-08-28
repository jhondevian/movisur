import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; revisionId: string }> }
) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id, revisionId } = await context.params;
  const productFile = await prisma.movisurProductFile.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      deletedAt: true,
    },
  });

  if (!productFile) {
    return NextResponse.json(
      { message: "El archivo no existe." },
      { status: 404 }
    );
  }

  if (productFile.deletedAt) {
    return NextResponse.json(
      { message: "Recupera el archivo antes de modificar su historial." },
      { status: 400 }
    );
  }

  if (user.role === "creador" && productFile.createdById !== user.id) {
    return NextResponse.json(
      { message: "No puedes modificar el historial de otro usuario." },
      { status: 403 }
    );
  }

  const revision = await prisma.movisurProductFileRevision.findFirst({
    where: {
      id: revisionId,
      productFileId: id,
    },
  });

  if (!revision) {
    return NextResponse.json(
      { message: "La version no existe." },
      { status: 404 }
    );
  }

  const revisionCount = await prisma.movisurProductFileRevision.count({
    where: { productFileId: id },
  });

  if (revisionCount <= 1 && user.role !== "admin") {
    return NextResponse.json(
      { message: "No puedes eliminar la unica version del archivo." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (revisionCount <= 1) {
        await tx.movisurProductFileRevision.delete({
          where: { id: revision.id },
        });

        return { promoted: null };
      }

      if (!revision.isCurrent) {
        await tx.movisurProductFileRevision.delete({
          where: { id: revision.id },
        });

        return { promoted: null };
      }

      const fallback = await tx.movisurProductFileRevision.findFirst({
        where: {
          productFileId: id,
          id: { not: revision.id },
        },
        orderBy: { versionNumber: "desc" },
      });

      if (!fallback) {
        throw new Error("No hay una version anterior para restaurar.");
      }

      await tx.movisurProductFileRevision.delete({
        where: { id: revision.id },
      });

      await tx.movisurProductFileRevision.updateMany({
        where: { productFileId: id },
        data: { isCurrent: false },
      });

      await tx.movisurProductFileRevision.update({
        where: { id: fallback.id },
        data: { isCurrent: true },
      });

      const updatedFile = await tx.movisurProductFile.update({
        where: { id },
        data: {
          distribution: fallback.distribution,
          downloadUrl: fallback.downloadUrl,
          fileType: fallback.fileType,
          fileMimeType: fallback.fileMimeType,
          fileName: fallback.fileName,
          fileSize: fallback.fileSize,
        },
      });

      return { promoted: updatedFile };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete Movisur product file revision error", error);
    return NextResponse.json(
      { message: "No se pudo eliminar la version." },
      { status: 500 }
    );
  }
}
