import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  clearAdminToken,
  getAdminToken,
  isAdminAuthError,
  listAdminFeedbacks,
  type AdminFeedbackSummary,
} from "../../api/admin";
import SiteChrome from "../../components/SiteChrome";
import {
  ADMIN_FEEDBACK_PAGE_SIZE,
  ADMIN_FEEDBACK_STATUS_OPTIONS,
  ADMIN_FEEDBACK_TABS,
  buildAdminFeedbackListSearch,
  parseAdminFeedbackListSearch,
  type AdminFeedbackStatusFilter,
  type AdminFeedbackTab,
} from "../../lib/adminFeedbackList";

function buildNextSearch(params: {
  tab?: AdminFeedbackTab;
  status?: AdminFeedbackStatusFilter;
  page?: number;
}) {
  return buildAdminFeedbackListSearch({
    tab: params.tab,
    status: params.status,
    page: params.page,
  });
}

export default function AdminFeedbackListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [{ items, total, page, tab, status }, setListing] = useState<{
    items: AdminFeedbackSummary[];
    total: number;
    page: number;
    tab: AdminFeedbackTab;
    status: AdminFeedbackStatusFilter;
  }>({
    items: [],
    total: 0,
    page: 1,
    tab: "unreplied",
    status: "all",
  });
  const [error, setError] = useState("");
  const view = useMemo(() => parseAdminFeedbackListSearch(searchParams.toString()), [searchParams]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_FEEDBACK_PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      if (!getAdminToken()) {
        navigate("/admin/login", { replace: true });
        return;
      }

      try {
        const response = await listAdminFeedbacks({
          tab: view.tab,
          status: view.status,
          page: view.page,
          pageSize: ADMIN_FEEDBACK_PAGE_SIZE,
        });
        if (!cancelled) {
          setListing({
            items: response.items,
            total: response.total,
            page: response.page,
            tab: view.tab,
            status: view.status,
          });
          setError("");
        }
      } catch (loadError) {
        if (isAdminAuthError(loadError)) {
          clearAdminToken();
          navigate("/admin/login", { replace: true });
          return;
        }

        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "加载失败");
        }
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, [navigate, view.page, view.status, view.tab]);

  function updateSearch(next: { tab?: AdminFeedbackTab; status?: AdminFeedbackStatusFilter; page?: number }) {
    setSearchParams(
      buildNextSearch({
        tab: next.tab ?? view.tab,
        status: next.status ?? view.status,
        page: next.page ?? view.page,
      }),
    );
  }

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "管理员看板" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Admin Console</p>
        <h1 className="section-title">匿名反馈看板</h1>
        <p className="hero-copy">优先处理尚未回复的新反馈，并按状态筛选、分页回看已处理内容。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="detail-card admin-controls-panel">
        <div className="admin-filter-header">
          <div className="saved-thread-list admin-tab-list" role="tablist" aria-label="反馈分组">
            {ADMIN_FEEDBACK_TABS.map((item) => (
              <button
                aria-selected={view.tab === item.value}
                className={`saved-thread-chip admin-tab-chip${view.tab === item.value ? " admin-tab-active" : ""}`}
                key={item.value}
                onClick={() => updateSearch({ tab: item.value, page: 1 })}
                role="tab"
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="field admin-filter-field">
            <span>状态分类</span>
            <select
              aria-label="状态分类"
              onChange={(event) =>
                updateSearch({
                  status: event.target.value as AdminFeedbackStatusFilter,
                  page: 1,
                })
              }
              value={view.status}
            >
              {ADMIN_FEEDBACK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-footer admin-list-meta">
          <span className="helper-copy">
            当前 {tab === "unreplied" ? "未回复" : "已处理"} 视图，共 {total} 条，第 {page} / {totalPages} 页。
          </span>
          <div className="wall-action-row">
            <button
              className="ghost-button"
              disabled={page <= 1}
              onClick={() => updateSearch({ page: page - 1 })}
              type="button"
            >
              上一页
            </button>
            <button
              className="ghost-button"
              disabled={page >= totalPages}
              onClick={() => updateSearch({ page: page + 1 })}
              type="button"
            >
              下一页
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              className="admin-row"
              key={item.id}
              to={`/admin/feedbacks/${item.id}${buildAdminFeedbackListSearch({
                tab: view.tab,
                status: view.status,
                page: view.page,
              })}`}
            >
              <div>
                <strong>{item.thread_code}</strong>
                <p>{item.category}</p>
              </div>
              <span className="status-pill">{item.status}</span>
            </Link>
          ))
        ) : (
          <article className="admin-row">
            <div>
              <strong>当前筛选下没有反馈</strong>
              <p>可以切换状态分类或查看已处理内容。</p>
            </div>
            <span className="status-pill">{view.tab === "unreplied" ? "empty" : "done"}</span>
          </article>
        )}
      </section>
    </main>
  );
}
