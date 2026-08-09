import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export type AdminMovisurPlanInput = {
  id?: string;
  name: string;
  durationMonths: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

export function parsePlans(value: string): AdminMovisurPlanInput[] {
  const plans = JSON.parse(value || "[]") as Partial<AdminMovisurPlanInput>[];

  return plans
    .map((plan, index) => ({
      id: typeof plan.id === "string" ? plan.id : undefined,
      name: String(plan.name || "").trim(),
      durationMonths: Math.max(1, Number(plan.durationMonths || 1)),
      price: Math.max(0, Number(plan.price || 0)),
      currency: String(plan.currency || "USD").trim() || "USD",
      isActive: Boolean(plan.isActive),
      sortOrder: Number(plan.sortOrder ?? index),
    }))
    .filter((plan) => plan.name);
}

export async function saveAdminMovisurImage(file: File, folder: string) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Solo se permiten imagenes PNG, JPG o WebP.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("La imagen no debe superar 2 MB.");
  }

  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${folder}-${Date.now()}.${extension}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    folder
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer())
  );

  return `/uploads/movisur/${folder}/${fileName}`;
}
