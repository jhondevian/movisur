"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export type SidebarVariant = "admin" | "usuario" | "creador" | "moderador";

const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Movisur",
    subItems: [
      { name: "Versiones", path: "/admin/movisur", pro: false },
      { name: "Venta", path: "/admin/movisur/venta", pro: false },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Configuracion",
    path: "/admin/movisur/configuracion",
  },
  {
    icon: <BoxCubeIcon />,
    name: "APK App",
    path: "/admin/apk",
  },
  {
    icon: <TableIcon />,
    name: "Compras",
    path: "/admin/compras",
  },
  {
    icon: <UserCircleIcon />,
    name: "Creadores",
    subItems: [
      { name: "Solicitudes", path: "/admin/creadores/solicitudes", pro: false },
      { name: "Administrar", path: "/admin/creadores", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Usuarios",
    path: "/admin/usuarios",
  },
  {
    icon: <ListIcon />,
    name: "Archivos",
    path: "/admin/archivos",
  },
  {
    icon: <TableIcon />,
    name: "Telegram",
    subItems: [
      { name: "Archivos", path: "/admin/telegram", pro: false },
      { name: "Configurar", path: "/admin/telegram/configurar", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Perfil",
    path: "/admin/profile",
  },
];

const roleNavItems: Record<Exclude<SidebarVariant, "admin">, NavItem[]> = {
  usuario: [
    {
      icon: <GridIcon />,
      name: "Usuario",
      subItems: [
        { name: "Resumen", path: "/usuario", pro: false },
        { name: "Mis compras", path: "/usuario/compras", pro: false },
        { name: "Mis accesos", path: "/usuario/accesos", pro: false },
        { name: "Descargas", path: "/usuario/descargas", pro: false },
      ],
    },
    {
      icon: <UserCircleIcon />,
      name: "Perfil",
      path: "/usuario/perfil",
    },
  ],
  creador: [
    {
      icon: <GridIcon />,
      name: "Creador",
      subItems: [
        { name: "Resumen", path: "/creador", pro: false },
        { name: "Archivos", path: "/creador/archivos", pro: false },
        { name: "Licencias", path: "/creador/licencias", pro: false },
        { name: "Alquiler", path: "/creador/alquiler", pro: false },
        { name: "Compras", path: "/creador/compras", pro: false },
      ],
    },
    {
      icon: <UserCircleIcon />,
      name: "Perfil",
      path: "/creador/perfil",
    },
  ],
  moderador: [
    {
      icon: <GridIcon />,
      name: "Moderador",
      subItems: [
        { name: "Resumen", path: "/moderador", pro: false },
        { name: "Revisiones", path: "/moderador/revisiones", pro: false },
        { name: "Reportes", path: "/moderador/reportes", pro: false },
      ],
    },
    {
      icon: <UserCircleIcon />,
      name: "Perfil",
      path: "/moderador/perfil",
    },
  ],
};

const AppSidebar: React.FC<{ variant?: SidebarVariant }> = ({
  variant = "admin",
}) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [creatorTrashCount, setCreatorTrashCount] = useState(0);
  const isActive = useCallback((path: string) => path === pathname, [pathname]);
  useEffect(() => {
    if (variant !== "creador") return;

    let isMounted = true;

    fetch("/api/creador/archivos/basurero/count", {
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : { count: 0 }))
      .then((data) => {
        if (isMounted) {
          setCreatorTrashCount(Number(data?.count || 0));
        }
      })
      .catch(() => {
        if (isMounted) setCreatorTrashCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, [variant, pathname]);

  const baseNavItems = variant === "admin" ? adminNavItems : roleNavItems[variant];
  const navItems =
    variant === "creador" && creatorTrashCount > 0
      ? baseNavItems.map((item) =>
          item.name === "Creador" && item.subItems
            ? {
                ...item,
                subItems: [
                  ...item.subItems.slice(0, 2),
                  {
                    name: "Basurero",
                    path: "/creador/archivos/basurero",
                    pro: false,
                  },
                  ...item.subItems.slice(2),
                ],
              }
            : item
        )
      : baseNavItems;
  const homePath = variant === "admin" ? "/admin" : `/${variant}`;

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                displayedOpenSubmenu?.type === menuType && displayedOpenSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  displayedOpenSubmenu?.type === menuType && displayedOpenSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    displayedOpenSubmenu?.type === menuType &&
                    displayedOpenSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  displayedOpenSubmenu?.type === menuType && displayedOpenSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const getActiveSubmenu = () => {
    for (const menuType of ["main", "others"] as const) {
      const items = menuType === "main" ? navItems : [];
      const index = items.findIndex((nav) =>
        nav.subItems?.some((subItem) => isActive(subItem.path))
      );

      if (index !== -1) {
        return { type: menuType, index };
      }
    }

    return null;
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const displayedOpenSubmenu = openSubmenu ?? getActiveSubmenu();
  const displayedOpenSubmenuType = displayedOpenSubmenu?.type;
  const displayedOpenSubmenuIndex = displayedOpenSubmenu?.index;
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (displayedOpenSubmenuType && displayedOpenSubmenuIndex !== undefined) {
      const key = `${displayedOpenSubmenuType}-${displayedOpenSubmenuIndex}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [displayedOpenSubmenuType, displayedOpenSubmenuIndex]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu(() => {
      if (
        displayedOpenSubmenu &&
        displayedOpenSubmenu.type === menuType &&
        displayedOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={homePath}>
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
                M
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Movisur
              </span>
            </span>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
              M
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
