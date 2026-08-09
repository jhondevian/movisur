"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserDetailFormProps = {
  backHref: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
};

export default function AdminUserDetailForm({
  backHref,
  user,
}: AdminUserDetailFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          role,
          password,
          confirmPassword,
        }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message || "No se pudo actualizar el usuario.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Usuario actualizado correctamente.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalles del usuario
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Actualiza datos principales, rol y contraseña.
          </p>
        </div>
        <a
          href={backHref}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Volver
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-4xl font-bold text-brand-500 dark:bg-brand-500/10">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.firstName}
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              user.firstName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="mt-5 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-500 dark:bg-brand-500/10">
              {user.role}
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm dark:border-gray-800">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">ID</span>
              <span className="max-w-[180px] truncate font-medium text-gray-900 dark:text-white">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Registro</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {user.createdAt}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Ultimo login</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {user.lastLoginAt || "-"}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nombres
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Apellidos
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Correo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Telefono
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Rol
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="usuario">Usuario</option>
                <option value="creador">Creador</option>
                <option value="moderador">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Cambiar contraseña
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Deja estos campos vacios si no quieres cambiarla.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nueva contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Confirmar contraseña
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {message ? (
              <p className="text-sm font-medium text-brand-500">{message}</p>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-theme-md transition hover:bg-brand-600 disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
