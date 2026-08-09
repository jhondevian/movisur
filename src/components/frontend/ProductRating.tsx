"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductRatingProps = {
  productFileId: string;
  isLoggedIn: boolean;
  canRate: boolean;
  initialAverage: number;
  initialCount: number;
  initialUserRating: number;
};

function formatAverage(value: number) {
  return value > 0 ? value.toFixed(1) : "0.0";
}

export default function ProductRating({
  productFileId,
  isLoggedIn,
  canRate,
  initialAverage,
  initialCount,
  initialUserRating,
}: ProductRatingProps) {
  const router = useRouter();
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [userRating, setUserRating] = useState(initialUserRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRating(rating: number) {
    if (!isLoggedIn) {
      router.push(`/signin?next=${window.location.pathname}`);
      return;
    }

    if (!canRate) {
      setMessage("Descarga el producto antes de calificar.");
      return;
    }

    if (isSubmitting) return;

    setMessage("");
    setIsSubmitting(true);

    const response = await fetch(
      `/api/movisur/product-files/${productFileId}/rating`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      }
    );

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo guardar tu calificacion.");
      return;
    }

    const payload = (await response.json()) as {
      averageRating: number;
      ratingCount: number;
      rating: number;
    };

    setAverage(payload.averageRating);
    setCount(payload.ratingCount);
    setUserRating(payload.rating);
    setMessage("Calificacion guardada.");
  }

  const activeRating = hoveredRating || userRating;

  return (
    <div className="mt-7 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => submitRating(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(0)}
            disabled={isSubmitting}
            className={`text-3xl transition ${
              rating <= activeRating
                ? "text-warning-400"
                : "text-gray-300 dark:text-gray-700"
            } disabled:cursor-not-allowed`}
            aria-label={`Calificar con ${rating} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
        {formatAverage(average)} de 5 ({count} calificaciones)
      </p>
      {message ? (
        <p className="text-sm font-medium text-brand-500">{message}</p>
      ) : !isLoggedIn ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Inicia sesion para calificar.
        </p>
      ) : !canRate ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Descarga el producto para habilitar la calificacion.
        </p>
      ) : null}
    </div>
  );
}
