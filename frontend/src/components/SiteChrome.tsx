import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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

const NAV_ITEMS = [
  { label: "首页", to: "/", exact: true },
  { label: "我要吐槽", to: "/submit/vent" },
  { label: "我有提案", to: "/submit/proposal" },
  { label: "查询追踪", to: "/track" },
  { label: "回音壁", to: "/wall" },
  { label: "管理员", to: "/admin/feedbacks", prefixes: ["/admin"] },
] as const;

const THEME_OPTIONS: Array<{ label: string; value: ThemePreference }> = [
  { label: "跟随系统", value: "system" },
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
];

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

export default function SiteChrome({ breadcrumbs }: SiteChromeProps) {
  const location = useLocation();
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => readThemePreference());
  const isArchitecturePage =
    location.pathname === "/architecture" || location.pathname.startsWith("/architecture/");

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

  function handleThemeChange(nextPreference: ThemePreference) {
    saveThemePreference(nextPreference);
    setThemePreference(nextPreference);
    applyThemePreference(nextPreference);
  }

  return (
    <header className="site-chrome">
      <div className="site-nav-row">
        <Link className="site-brand" to="/">
          Echo｜TechVoice
        </Link>
        <div className="site-nav-stack">
          <nav aria-label="主导航" className="site-nav">
            {NAV_ITEMS.map((item) => (
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
            <Link
              className={`site-utility-link${isArchitecturePage ? " site-utility-link-active" : ""}`}
              to="/architecture"
            >
              系统架构
            </Link>
            <label className="theme-select-shell">
              <span className="theme-select-label">显示</span>
              <select
                aria-label="主题模式"
                className="theme-select"
                onChange={(event) => handleThemeChange(event.target.value as ThemePreference)}
                value={themePreference}
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
