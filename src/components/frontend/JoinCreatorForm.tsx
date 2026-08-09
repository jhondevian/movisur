"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type JoinCreatorFormProps = {
  draftKey: string;
  initialStatus: "none" | "pending" | "approved" | "rejected";
  initialMessage?: string | null;
  initialPublicName?: string | null;
  initialCountry?: string | null;
  initialSpecialty?: string | null;
  initialWhatsapp?: string | null;
  initialImageUrl?: string | null;
};

export default function JoinCreatorForm({
  draftKey,
  initialStatus,
  initialMessage,
  initialPublicName,
  initialCountry,
  initialSpecialty,
  initialWhatsapp,
  initialImageUrl,
}: JoinCreatorFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [publicName, setPublicName] = useState(initialPublicName || "");
  const [country, setCountry] = useState(initialCountry || "");
  const [specialty, setSpecialty] = useState(initialSpecialty || "");
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp || "");
  const [message, setMessage] = useState(initialMessage || "");
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl || "");
  const [status, setStatus] = useState(initialStatus);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const image = formData.get("image");

      if (
        (!(image instanceof File) || image.size === 0) &&
        previewUrl.startsWith("data:image/")
      ) {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        formData.set("image", new File([blob], "creator-image.png", {
          type: blob.type || "image/png",
        }));
      }

      const response = await fetch("/api/creator-access-requests", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback(data.message || "No se pudo enviar la solicitud.");
        return;
      }

      setStatus("pending");
      window.localStorage.removeItem(draftKey);
      setFeedback("Solicitud enviada. Un admin revisara tu acceso.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLocked = status === "pending" || status === "approved";

  useEffect(() => {
    if (isLocked) return;

    const savedDraft = window.localStorage.getItem(draftKey);
    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft) as {
        publicName?: string;
        country?: string;
        specialty?: string;
        whatsapp?: string;
        message?: string;
        previewUrl?: string;
      };

      setPublicName((current) => current || draft.publicName || "");
      setCountry((current) => current || draft.country || "");
      setSpecialty((current) => current || draft.specialty || "");
      setWhatsapp((current) => current || draft.whatsapp || "");
      setMessage((current) => current || draft.message || "");
      setPreviewUrl((current) => current || draft.previewUrl || "");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey, isLocked]);

  useEffect(() => {
    if (isLocked) return;

    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        publicName,
        country,
        specialty,
        whatsapp,
        message,
        previewUrl: previewUrl.startsWith("data:image/") ? previewUrl : "",
      })
    );
  }, [
    country,
    draftKey,
    isLocked,
    message,
    previewUrl,
    publicName,
    specialty,
    whatsapp,
  ]);
  const completedFields = [
    previewUrl,
    publicName.trim(),
    country.trim(),
    specialty.trim(),
    whatsapp.trim(),
    message.trim(),
  ].filter(Boolean).length;
  const progress = Math.round((completedFields / 6) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white">
            Perfil de creador
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Prepara tu perfil publico para vender licencias, alquileres y
            archivos dentro de Movisur.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLocked}
            className="relative mt-7 flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-center text-sm font-semibold text-gray-500 transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Imagen del creador"
                fill
                sizes="176px"
                className="object-cover"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            ) : (
              <span>Subir imagen</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            disabled={isLocked}
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div>
          {status === "approved" ? (
            <div className="mb-6 rounded-xl bg-success-50 p-4 text-sm font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
              Tu solicitud ya fue aprobada. Refresca la pagina y entra a tu
              panel de creador.
            </div>
          ) : null}

          {status === "pending" ? (
            <div className="mb-6 rounded-xl bg-warning-50 p-4 text-sm font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
              Tu solicitud esta pendiente de revision.
            </div>
          ) : null}

          {status === "rejected" ? (
            <div className="mb-6 rounded-xl bg-error-50 p-4 text-sm font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400">
              Tu solicitud anterior fue rechazada. Puedes enviar una nueva con
              mas informacion.
            </div>
          ) : null}

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>Progreso del perfil</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-gray-950 dark:text-white">
                Que podras hacer como creador
              </h2>
              <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  "Subir archivos, videos y productos descargables.",
                  "Vender licencias con tus propios precios.",
                  "Publicar alquileres de tools por horas.",
                  "Agregar cuentas para entrega automatica.",
                  "Configurar tus metodos de pago con QR.",
                  "Revisar compras, confirmar pagos y ver entregas.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 text-sm font-medium leading-6 text-gray-700 dark:text-gray-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Nombre publico
                </label>
                <input
                  name="publicName"
                  value={publicName}
                  onChange={(event) => setPublicName(event.target.value)}
                  disabled={isLocked}
                  maxLength={120}
                  placeholder="Ejemplo: Alex Unlocks"
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Pais
                </label>
                <input
                  name="country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  disabled={isLocked}
                  maxLength={80}
                  placeholder="Peru, Bolivia, Colombia..."
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Especialidad
                </label>
                <input
                  name="specialty"
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                  disabled={isLocked}
                  maxLength={160}
                  placeholder="FRP, unlock, licencias, soporte remoto..."
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  WhatsApp
                </label>
                <input
                  name="whatsapp"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  disabled={isLocked}
                  maxLength={40}
                  placeholder="+51 999 999 999"
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="creator-message"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Que vas a ofrecer
              </label>
              <textarea
                id="creator-message"
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isLocked}
                rows={5}
                maxLength={800}
                placeholder="Cuenta que productos, licencias o alquileres quieres publicar y como trabajas con los usuarios."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {message.length}/800
              </p>
            </div>

            {feedback ? (
              <p className="text-sm font-medium text-brand-500">{feedback}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-theme-md transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
