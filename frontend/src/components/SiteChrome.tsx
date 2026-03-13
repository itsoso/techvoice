import { Link, useLocation } from "react-router-dom";

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

  return (
    <header className="site-chrome">
      <div className="site-nav-row">
        <Link className="site-brand" to="/">
          Echo｜TechVoice
        </Link>
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
