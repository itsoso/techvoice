import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { clearAdminToken, getAdminEntryLink, getAdminToken } from "../api/admin";
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "../lib/theme";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type SiteChromeProps = {
  breadcrumbs: BreadcrumbItem[];
};

const BASE_NAV_ITEMS = [
  { label: "首页", to: "/", exact: true },
  { label: "我要吐槽", to: "/submit/vent" },
  { label: "我有提案", to: "/submit/proposal" },
  { label: "查询追踪", to: "/track" },
  { label: "回音壁", to: "/wall" },
] as const;

const THEME_OPTIONS: Array<{ label: string; value: ThemePreference }> = [
  { label: "跟随系统", value: "system" },
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
];

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

function isActivePath(
  pathname: string,
  item: { to: string; exact?: boolean; prefixes?: readonly string[] },
) {
  if (item.exact) {
    return pathname === item.to;
  }

  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
    return true;
  }

  return item.prefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

function getTenantScopedNavItem(pathname: string) {
  const matched = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  if (!matched) {
    return null;
  }

  const tenantSlug = matched[1];
  return {
    label: "会客厅",
    to: `/t/${tenantSlug}/lounge`,
    prefixes: [
      `/t/${tenantSlug}/lounge`,
      `/t/${tenantSlug}/executive`,
      `/t/${tenantSlug}/admin`,
    ] as const,
  };
}

export default function SiteChrome({ breadcrumbs }: SiteChromeProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => readThemePreference());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => Boolean(getAdminToken()));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isArchitecturePage =
    location.pathname === "/architecture" || location.pathname.startsWith("/architecture/");
  const isRetrospectivePage =
    location.pathname === "/retrospective" || location.pathname.startsWith("/retrospective/");
  const adminEntry = isAdminLoggedIn
    ? { label: "管理员", to: "/admin/feedbacks" }
    : getAdminEntryLink();
  const tenantNavItem = getTenantScopedNavItem(location.pathname);
  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(tenantNavItem ? [tenantNavItem] : []),
    {
      label: adminEntry.label,
      to: adminEntry.to,
      prefixes: ["/admin"],
    },
  ] as const;
  const displayLabel = useMemo(() => THEME_LABELS[themePreference], [themePreference]);

  useEffect(() => {
    applyThemePreference(themePreference);

    if (themePreference !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyThemePreference("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [themePreference]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleThemeChange(nextPreference: ThemePreference) {
    saveThemePreference(nextPreference);
    setThemePreference(nextPreference);
    applyThemePreference(nextPreference);
    setMenuOpen(false);
  }

  function handleAdminLogout() {
    clearAdminToken();
    setIsAdminLoggedIn(false);
    navigate("/admin/login");
  }

  return (
    <header className="site-chrome">
      <div className="site-nav-row">
        <Link className="site-brand" to="/">
          Echo｜TechVoice
        </Link>
        <nav aria-label="主导航" className="site-nav">
          {navItems.map((item) => (
            <Link
              className={`site-nav-link${isActivePath(location.pathname, item) ? " site-nav-link-active" : ""}`}
              key={item.label}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-utility-row">
          {isAdminLoggedIn ? (
            <button className="admin-logout-button" onClick={handleAdminLogout} type="button">
              退出
            </button>
          ) : null}
          <div className="display-menu-shell" ref={menuRef}>
            <button
              aria-label={`显示设置，当前${displayLabel}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={`display-menu-trigger${menuOpen ? " display-menu-trigger-open" : ""}`}
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              <span className="sr-only">显示设置</span>
              <strong className="display-menu-value">{displayLabel}</strong>
              <span aria-hidden="true" className="display-menu-caret">
                ▾
              </span>
            </button>

            {menuOpen ? (
              <div aria-label="显示菜单" className="display-menu-popover" role="menu">
                <div className="display-menu-group">
                  <p className="display-menu-group-label">主题</p>
                  {THEME_OPTIONS.map((option) => (
                    <button
                      aria-checked={themePreference === option.value}
                      className={`display-menu-item${
                        themePreference === option.value ? " display-menu-item-active" : ""
                      }`}
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      role="menuitemradio"
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="display-menu-divider" />

                <div className="display-menu-group">
                  <p className="display-menu-group-label">说明</p>
                  <Link
                    className={`display-menu-link${isArchitecturePage ? " display-menu-link-active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    to="/architecture"
                  >
                    系统架构
                  </Link>
                  <Link
                    className={`display-menu-link${isRetrospectivePage ? " display-menu-link-active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    to="/retrospective"
                  >
                    项目复盘
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {breadcrumbs.length > 0 ? (
        <nav aria-label="面包屑" className="breadcrumb-trail">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span className="breadcrumb-item" key={`${item.label}-${index}`}>
                {item.to && !isLast ? (
                  <Link className="breadcrumb-link" to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-current">{item.label}</span>
                )}
                {!isLast ? <span className="breadcrumb-separator">/</span> : null}
              </span>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
