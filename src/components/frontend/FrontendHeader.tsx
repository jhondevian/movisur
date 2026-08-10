"use client";

import type { AuthUser } from "@/lib/auth";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import {
  cartChangedEvent,
  getCartItems,
  removeCartItem,
  type CartItem,
} from "@/lib/frontend-cart";
import { getDashboardPath } from "@/lib/role-routes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Productos", href: "/#operaciones" },
  { label: "FRP Bypass", href: "/frp-bypass" },
  { label: "Informacion", href: "/informacion" },
];

function canAccessAdmin(user: AuthUser | null) {
  return user?.role === "admin";
}

function getPrimaryHref(user: AuthUser | null) {
  if (!user) return "/signin";
  return getDashboardPath(user.role);
}

function getPrimaryLabel(user: AuthUser | null) {
  if (!user) return "Iniciar sesion";
  if (canAccessAdmin(user)) return "Panel admin";
  if (user.role === "moderador") return "Panel moderador";
  if (user.role === "creador") return "Panel creador";
  return "Panel usuario";
}

export default function FrontendHeader() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (!response.ok) return;

        const data = (await response.json()) as { user: AuthUser | null };
        if (isMounted) setUser(data.user);
      } catch {
        if (isMounted) setUser(null);
      }
    }

    loadUser();
    const interval = window.setInterval(loadUser, 15_000);
    window.addEventListener("focus", loadUser);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadUser);
    };
  }, []);

  useEffect(() => {
    setCartItems(getCartItems());

    function handleCartChange() {
      setCartItems(getCartItems());
    }

    window.addEventListener(cartChangedEvent, handleCartChange);
    window.addEventListener("storage", handleCartChange);

    return () => {
      window.removeEventListener(cartChangedEvent, handleCartChange);
      window.removeEventListener("storage", handleCartChange);
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setIsSigningOut(false);
      setIsMenuOpen(false);
      router.refresh();
    }
  }

  const primaryHref = getPrimaryHref(user);
  const primaryLabel = getPrimaryLabel(user);
  const showJoinButton = user?.role === "usuario";
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price || 0),
    0
  );
  const cartCurrency = cartItems[0]?.currency ?? "USD";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/movisur-logo.png"
            alt="Movisur"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Movisur
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-brand-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggleButton />
          {user && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {user.firstName}
            </span>
          )}
          {cartItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen((value) => !value);
                  setIsMenuOpen(false);
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center text-gray-700 transition hover:text-brand-500 dark:text-gray-300"
                aria-label="Abrir carrito"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  />
                </svg>
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
                  {cartItems.length}
                </span>
              </button>

              {isCartOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Tu compra
                  </h3>
                  <div className="mt-3 space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.currency} {item.price}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCartItems(removeCartItem(item.id))}
                            className="text-xs font-medium text-error-500"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>
                          {cartCurrency} {cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <Link
                        href="/informacion?comprar=1"
                        onClick={() => setIsCartOpen(false)}
                        className="mt-3 block rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white"
                      >
                        Comprar
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <Link
            href={primaryHref}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            {primaryLabel}
          </Link>
          {showJoinButton && (
            <Link
              href="/unete"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Unete
            </Link>
          )}
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {isSigningOut ? "Saliendo..." : "Salir"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleButton />
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen((value) => !value);
              setIsCartOpen(false);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            aria-label="Abrir menu"
          >
            <span className="sr-only">Menu</span>
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-950 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                {user.firstName}
              </div>
            )}
            {cartItems.length > 0 && (
              <Link
                href="/informacion?comprar=1"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Tu compra ({cartItems.length})
              </Link>
            )}
            <Link
              href={primaryHref}
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 rounded-lg bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white"
            >
              {primaryLabel}
            </Link>
            {showJoinButton && (
              <Link
                href="/unete"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Unete
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {isSigningOut ? "Saliendo..." : "Cerrar sesion"}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
