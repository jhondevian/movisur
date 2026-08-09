import MovisurSaleForm from "@/components/movisur/MovisurSaleForm";
import { ensureMovisurCommerceSettings } from "@/lib/movisur-commerce";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venta | Movisur",
  description: "Configura el precio y venta de Movisur Tool",
};

export default async function MovisurVentaPage() {
  const { saleSettings, paymentMethods, salePlans } =
    await ensureMovisurCommerceSettings();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Venta
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Configura el precio de venta del producto y revisa los metodos activos.
        </p>
      </div>

      <MovisurSaleForm
        settings={{
          productName: saleSettings.productName,
          currency: saleSettings.currency,
          description: saleSettings.description,
          isActive: saleSettings.isActive,
        }}
        paymentMethods={paymentMethods}
        plans={salePlans.map((plan) => ({
          name: plan.name,
          durationMonths: plan.durationMonths,
          price: plan.price.toString(),
          isActive: plan.isActive,
          includedItems: plan.includedItems.map((item) => item.name),
        }))}
      />
    </div>
  );
}
