import { requireAdminUser } from "@/lib/admin-auth";
import {
  decryptIcloudApiKey,
  encryptIcloudApiKey,
  getIcloudCheckSettings,
} from "@/lib/icloud-check";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type IcloudSettingsPayload = {
  apiBaseUrl?: string;
  apiKey?: string;
  isEnabled?: boolean;
  serviceId?: string;
};

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | IcloudSettingsPayload
    | null;

  if (!payload) {
    return NextResponse.json(
      { message: "Configuracion invalida." },
      { status: 400 }
    );
  }

  const current = await getIcloudCheckSettings();
  const apiKey = String(payload.apiKey || "").trim();
  const existingApiKey = decryptIcloudApiKey(current.apiKeyEncrypted);
  const apiBaseUrl =
    String(payload.apiBaseUrl || "").trim() ||
    "https://api.ifreeicloud.co.uk";
  const serviceId = String(payload.serviceId || "").trim();

  if (!apiBaseUrl.startsWith("https://")) {
    return NextResponse.json(
      { message: "La API base URL debe usar HTTPS." },
      { status: 400 }
    );
  }

  if (!apiKey && !existingApiKey && !process.env.IFREEICLOUD_API_KEY) {
    return NextResponse.json(
      { message: "Agrega la API key de iFreeiCloud." },
      { status: 400 }
    );
  }

  if (!serviceId) {
    return NextResponse.json(
      { message: "Agrega el Service ID de iFreeiCloud." },
      { status: 400 }
    );
  }

  await prisma.icloudCheckSettings.update({
    where: { id: current.id },
    data: {
      apiBaseUrl,
      apiKeyEncrypted: apiKey
        ? encryptIcloudApiKey(apiKey)
        : current.apiKeyEncrypted,
      isEnabled: Boolean(payload.isEnabled),
      lastConnectionAt: new Date(),
      serviceId,
    },
  });

  return NextResponse.json({ message: "iCloud Check actualizado." });
}
