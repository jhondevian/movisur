"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type ProfileFormUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
};

type ProfileFormProps = {
  user: ProfileFormUser;
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
        user?: { avatarUrl?: string | null };
      } | null;

      if (!response.ok) {
        setErrorMessage(data?.message ?? "No se pudo actualizar el perfil.");
        return;
      }

      if (data?.user?.avatarUrl !== undefined) {
        setAvatarPreview(data.user.avatarUrl);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatusMessage("Perfil actualizado correctamente.");
      window.dispatchEvent(new Event("movisur-profile-updated"));
      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-4 lg:w-64">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-4xl font-bold text-brand-500 transition ring-4 ring-transparent hover:ring-brand-500/20 dark:bg-brand-500/10"
            aria-label="Actualizar imagen de perfil"
          >
            {avatarPreview ? (
              avatarPreview.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={avatarPreview}
                  width={128}
                  height={128}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              user.firstName.slice(0, 1).toUpperCase()
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gray-950/65 py-2 text-white opacity-0 transition group-hover:opacity-100">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8h4l1.5-2h5L16 8h4v11H4V8ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                />
              </svg>
            </span>
          </button>
          <input
            ref={fileInputRef}
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Presiona la imagen para actualizarla.
          </p>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600 dark:bg-white/[0.05] dark:text-gray-300">
            {user.role}
          </span>
        </div>

        <div className="grid flex-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombres
            </span>
            <input
              name="firstName"
              defaultValue={user.firstName}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Apellidos
            </span>
            <input
              name="lastName"
              defaultValue={user.lastName}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo
            </span>
            <input
              name="email"
              type="email"
              defaultValue={user.email}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Telefono
            </span>
            <input
              name="phone"
              defaultValue={user.phone ?? ""}
              placeholder="+51 999 999 999"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 md:col-span-2">
              {errorMessage}
            </div>
          ) : null}
          {statusMessage ? (
            <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 md:col-span-2">
              {statusMessage}
            </div>
          ) : null}

          <div className="flex justify-end md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
