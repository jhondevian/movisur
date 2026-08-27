import { requireAdminUser } from "@/lib/admin-auth";
import { importTelegramFileToMovisurWithOwner } from "@/lib/telegram-import";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await importTelegramFileToMovisurWithOwner(id, admin.id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo importar el archivo.",
      },
      { status: 400 }
    );
  }
}
