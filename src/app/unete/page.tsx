import JoinCreatorForm from "@/components/frontend/JoinCreatorForm";
import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unete como creador | Movisur",
  description: "Solicitud para acceder al panel creador de Movisur.",
};

export default async function UnetePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    redirect("/signin?next=/unete");
  }

  let authUser;

  try {
    authUser = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/unete");
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });

  if (!user) {
    redirect("/signin?next=/unete");
  }

  if (user.role === "creador") {
    redirect("/creador");
  }

  const request = await prisma.creatorAccessRequest.findFirst({
    where: { userId: authUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      message: true,
      publicName: true,
      country: true,
      specialty: true,
      whatsapp: true,
      imageUrl: true,
    },
  });

  return (
    <>
      <FrontendHeader />
      <main className="bg-white px-4 py-16 dark:bg-gray-950 sm:px-6 lg:px-8">
        <JoinCreatorForm
          draftKey={`movisur-creator-request-draft-${authUser.id}`}
          initialStatus={request?.status || "none"}
          initialMessage={request?.message}
          initialPublicName={request?.publicName}
          initialCountry={request?.country}
          initialSpecialty={request?.specialty}
          initialWhatsapp={request?.whatsapp}
          initialImageUrl={request?.imageUrl}
        />
      </main>
      <FrontendFooter />
    </>
  );
}
