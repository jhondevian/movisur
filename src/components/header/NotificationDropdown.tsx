"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  recipientUserId?: string | null;
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  return `hace ${Math.floor(hours / 24)} d`;
}

function getNotificationMeta(notification: AdminNotification) {
  if (notification.type === "creator_access_request") {
    return {
      href: "/admin/creadores/solicitudes",
      icon: "C",
      label: "Solicitud",
    };
  }

  if (notification.type === "payment_confirmed") {
    return {
      href: "/usuario/compras",
      icon: "✓",
      label: "Confirmado",
    };
  }

  return {
    href: notification.recipientUserId ? "/creador/compras" : "/admin/compras",
    icon: "$",
    label: "Venta",
  };
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [targetHref, setTargetHref] = useState("/admin/compras");
  const knownNotificationIds = useRef<Set<string> | null>(null);

  const notifyBrowser = useCallback((notification: AdminNotification) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      window.Notification.permission !== "granted"
    ) {
      return;
    }

    const meta = getNotificationMeta(notification);
    const desktopNotification = new window.Notification(notification.title, {
      body: notification.message,
      icon: "/images/movisur-logo.png",
      tag: notification.id,
    });

    desktopNotification.onclick = () => {
      window.focus();
      window.location.href = meta.href;
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/admin/notifications", {
      cache: "no-store",
    });

    if (!response.ok) return;

    const payload = (await response.json()) as {
      notifications: AdminNotification[];
      unreadCount: number;
      targetHref?: string;
    };

    const currentIds = new Set(
      payload.notifications.map((notification) => notification.id)
    );

    if (knownNotificationIds.current) {
      payload.notifications
        .filter(
          (notification) =>
            !notification.isRead &&
            !knownNotificationIds.current?.has(notification.id)
        )
        .forEach(notifyBrowser);
    }

    knownNotificationIds.current = currentIds;
    setNotifications(payload.notifications);
    setUnreadCount(payload.unreadCount);
    setTargetHref(payload.targetHref ?? "/admin/compras");
  }, [notifyBrowser]);

  useEffect(() => {
    if (
      "Notification" in window &&
      window.Notification.permission === "default" &&
      window.localStorage.getItem("movisur-notification-permission-asked") !==
        "1"
    ) {
      window.localStorage.setItem("movisur-notification-permission-asked", "1");
      window.setTimeout(() => {
        window.Notification.requestPermission().catch(() => undefined);
      }, 1200);
    }

    const timeout = window.setTimeout(loadNotifications, 0);
    const interval = window.setInterval(loadNotifications, 30_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  async function handleClick() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      await fetch("/api/admin/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 flex h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificaciones
          </h5>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 transition dropdown-toggle hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cerrar
          </button>
        </div>

        <ul className="flex h-auto flex-col overflow-y-auto custom-scrollbar">
          {notifications.length ? (
            notifications.map((notification) => {
              const meta = getNotificationMeta(notification);

              return (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <Link href={meta.href} className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-500 dark:bg-brand-500/10">
                      {meta.icon}
                    </span>
                    <span className="block">
                      <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {notification.title}
                      </span>
                      <span className="block text-theme-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </span>
                      <span className="mt-2 flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                        <span>{meta.label}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                        <span>{timeAgo(notification.createdAt)}</span>
                      </span>
                    </span>
                  </Link>
                </DropdownItem>
              </li>
              );
            })
          ) : (
            <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay notificaciones.
            </li>
          )}
        </ul>

        <Link
          href={targetHref}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Ver detalles
        </Link>
      </Dropdown>
    </div>
  );
}
