"use client";

export type CartItem = {
  id: string;
  name: string;
  price: string;
  currency: string;
  durationMonths: number;
};

const cartKey = "movisur_cart";
export const cartChangedEvent = "movisur-cart-changed";

function readCartStorage() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(cartKey);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed as CartItem[];
  } catch {
    return [];
  }
}

function writeCartStorage(items: CartItem[]) {
  window.localStorage.setItem(cartKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(cartChangedEvent, { detail: items }));
}

export function getCartItems() {
  return readCartStorage();
}

export function addCartItem(item: CartItem) {
  const items = readCartStorage();
  const exists = items.some((cartItem) => cartItem.id === item.id);
  const nextItems = exists
    ? items.map((cartItem) => (cartItem.id === item.id ? item : cartItem))
    : [...items, item];

  writeCartStorage(nextItems);
  return nextItems;
}

export function removeCartItem(id: string) {
  const nextItems = readCartStorage().filter((item) => item.id !== id);
  writeCartStorage(nextItems);
  return nextItems;
}

export function clearCartItems() {
  writeCartStorage([]);
}
