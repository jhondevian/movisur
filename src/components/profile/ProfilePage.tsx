import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

type ProfilePageProps = {
  title?: string;
  description?: string;
  nextPath: string;
};

export default async function ProfilePage({
  title = "Perfil",
  description = "Actualiza tu imagen y datos principales de cuenta.",
  nextPath,
}: ProfilePageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect(`/signin?next=${nextPath}`);

  let authUser;

  try {
    authUser = await verifyAuthToken(token);
  } catch {
    redirect(`/signin?next=${nextPath}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
    },
  });

  if (!user) redirect("/signin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
