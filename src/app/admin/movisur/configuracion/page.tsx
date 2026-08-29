import CreatorCommerceItemsForm from "@/components/movisur/CreatorCommerceItemsForm";
import IcloudCheckSettingsForm from "@/components/icloud/IcloudCheckSettingsForm";
import MovisurBrandCategoriesForm from "@/components/movisur/MovisurBrandCategoriesForm";
import MovisurPaymentMethodsForm from "@/components/movisur/MovisurPaymentMethodsForm";
import {
  decryptIcloudApiKey,
  getIcloudCheckSettings,
  maskIcloudApiKey,
} from "@/lib/icloud-check";
import { ensureMovisurCommerceSettings } from "@/lib/movisur-commerce";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuracion | Movisur",
  description: "Configura los metodos de pago disponibles para Movisur Tool",
};

const defaultRentalTools = [
  { name: "UNLOCKTOOL - RENT 6 HORAS", hours: 6, sortOrder: 1 },
  { name: "ANDROID MULTI TOOL (AMT) - RENT 2 HORAS", hours: 2, sortOrder: 2 },
  { name: "DFT PRO - RENT 40 HORAS", hours: 40, sortOrder: 3 },
  { name: "TSM TOOL PRO - RENT 6 HORAS", hours: 6, sortOrder: 4 },
  { name: "EGSM TOOL - RENT 12 HORAS", hours: 12, sortOrder: 5 },
  { name: "TFM TOOL PRO - RENT 3 HORAS", hours: 3, sortOrder: 6 },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

async function ensureDefaultRentalTools() {
  await Promise.all(
    defaultRentalTools.map(async (tool) => {
      const slug = slugify(tool.name);
      const existing = await prisma.creatorRentalTool.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) return;

      await prisma.creatorRentalTool.create({
        data: {
          name: tool.name,
          slug,
          description: `Alquiler por ${tool.hours} hora${
            tool.hours === 1 ? "" : "s"
          }.`,
          sortOrder: tool.sortOrder,
          isActive: true,
          plans: {
            create: {
              name: `${tool.hours} horas`,
              durationMonths: tool.hours,
              price: 0,
              currency: "USD",
              isActive: true,
              sortOrder: 0,
            },
          },
        },
      });
    }
    )
  );
}

export default async function MovisurConfiguracionPage() {
  const { paymentMethods } = await ensureMovisurCommerceSettings();
  const icloudSettings = await getIcloudCheckSettings();
  const envIcloudApiKey = process.env.IFREEICLOUD_API_KEY?.trim() || "";
  const dbIcloudApiKey = decryptIcloudApiKey(icloudSettings.apiKeyEncrypted);
  const icloudApiKey = envIcloudApiKey || dbIcloudApiKey;
  await ensureDefaultRentalTools();

  const [categories, licenseProducts, rentalTools] = await Promise.all([
    prisma.movisurBrandCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        models: {
          orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { name: "asc" }],
        },
      },
    }),
    prisma.creatorLicenseProduct.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        plans: {
          orderBy: [{ sortOrder: "asc" }, { durationMonths: "asc" }],
        },
      },
    }),
    prisma.creatorRentalTool.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        plans: {
          orderBy: [{ sortOrder: "asc" }, { durationMonths: "asc" }],
        },
      },
    }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuracion
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Activa PayPal, Binance, MercadoPago u otros metodos disponibles.
        </p>
      </div>

      <MovisurPaymentMethodsForm methods={paymentMethods} />
      <IcloudCheckSettingsForm
        apiBaseUrl={icloudSettings.apiBaseUrl}
        apiKeyMasked={
          envIcloudApiKey
            ? "Definida en IFREEICLOUD_API_KEY"
            : maskIcloudApiKey(icloudApiKey)
        }
        hasApiKey={Boolean(icloudApiKey)}
        isEnabled={icloudSettings.isEnabled}
        lastConnectionAt={
          icloudSettings.lastConnectionAt
            ? new Intl.DateTimeFormat("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(icloudSettings.lastConnectionAt)
            : null
        }
        serviceId={icloudSettings.serviceId || ""}
      />
      <MovisurBrandCategoriesForm categories={categories} />
      <CreatorCommerceItemsForm
        title="Licencias para creadores"
        description="Crea productos como Unlock Tool con imagen, descripcion y planes de acceso."
        nameLabel="Licencia"
        namePlaceholder="Unlock Tool"
        endpoint="/api/admin/movisur/creator-license-products"
        emptyText="Aun no hay licencias creadas."
        items={licenseProducts.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
          plans: item.plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            durationMonths: plan.durationMonths,
            price: plan.price.toString(),
            currency: plan.currency,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
          })),
        }))}
      />
      <CreatorCommerceItemsForm
        title="Alquilar tool"
        description="Configura tools que los creadores pueden alquilar por horas."
        nameLabel="Tool"
        namePlaceholder="UNLOCKTOOL - RENT 6 HORAS"
        endpoint="/api/admin/movisur/rental-tools"
        emptyText="Aun no hay tools de alquiler creadas."
        durationLabel="Horas"
        defaultPlanTemplates={[{ name: "6 horas", durationMonths: 6 }]}
        items={rentalTools.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          isActive: item.isActive,
          showInFrontend: item.showInFrontend,
          sortOrder: item.sortOrder,
          plans: item.plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            durationMonths: plan.durationMonths,
            price: plan.price.toString(),
            currency: plan.currency,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
          })),
        }))}
      />
    </div>
  );
}
