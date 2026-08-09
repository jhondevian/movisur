"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const roleOptions = [
  { value: "usuario", label: "Usuario" },
  { value: "creador", label: "Creador" },
  { value: "moderador", label: "Moderador" },
  { value: "admin", label: "Admin" },
];

export default function AdminCreateUserForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("usuario");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
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
      const data = (await response.json()) as {
        message?: string;
        user?: { id: string };
      };

      if (!response.ok) {
        setMessage(data.message || "No se pudo crear el usuario.");
        return;
      }

      router.push(`/admin/usuarios/${data.user?.id}`);
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
            Nuevo usuario
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Crea una cuenta y asígnale un rol desde administración.
          </p>
        </div>
        <Link
          href="/admin/usuarios"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Volver
        </Link>
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
            Teléfono
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Contraseña
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

        <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Rol inicial
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  role === option.value
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
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
            {isSaving ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
