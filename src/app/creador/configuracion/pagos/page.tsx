import MovisurPaymentMethodsForm from "@/components/movisur/MovisurPaymentMethodsForm";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { ensureCreatorPaymentMethods } from "@/lib/creator-payment-methods";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pagos del creador | Movisur",
  description: "Metodos de pago del creador",
};

export default async function CreadorPagosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/configuracion/pagos");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/configuracion/pagos");
  }

  const methods = await ensureCreatorPaymentMethods(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pagos
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Estos metodos apareceran en tus licencias, alquileres, archivos y
          productos cuando esten en venta.
        </p>
      </div>

      <MovisurPaymentMethodsForm
        methods={methods}
        title="Mis metodos de pago"
        description="Activa y configura los datos que veran tus compradores."
        submitEndpoint="/api/creador/payment-methods"
        imageEndpoint="/api/creador/payment-methods/image"
        imageUploadCodes={["binance", "transferencia"]}
      />
    </div>
  );
}
