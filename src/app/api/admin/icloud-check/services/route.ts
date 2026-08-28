import { requireAdminUser } from "@/lib/admin-auth";
import {
  decryptIcloudApiKey,
  fetchIcloudServiceList,
  getIcloudCheckSettings,
} from "@/lib/icloud-check";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ServicesPayload = {
  apiBaseUrl?: string;
  apiKey?: string;
};

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | ServicesPayload
    | null;
  const settings = await getIcloudCheckSettings();
  const apiKey =
    String(payload?.apiKey || "").trim() ||
    process.env.IFREEICLOUD_API_KEY?.trim() ||
    decryptIcloudApiKey(settings.apiKeyEncrypted);

  if (!apiKey) {
    return NextResponse.json(
      { message: "Agrega la API key antes de cargar servicios." },
      { status: 400 }
    );
  }

  try {
    const services = await fetchIcloudServiceList({
      apiBaseUrl: String(payload?.apiBaseUrl || "").trim() || settings.apiBaseUrl,
      apiKey,
    });

    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la lista de servicios.",
      },
      { status: 400 }
    );
  }
}
