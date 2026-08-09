import ProfilePage from "@/components/profile/ProfilePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil | Movisur",
  description: "Actualiza tus datos de perfil en Movisur",
};

export default function Profile() {
  return (
    <ProfilePage
      title="Perfil admin"
      description="Actualiza tu imagen y datos principales del panel."
      nextPath="/admin/profile"
    />
  );
}
