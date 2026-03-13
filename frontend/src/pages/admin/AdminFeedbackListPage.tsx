import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import {
  clearAdminToken,
  getAdminToken,
  isAdminAuthError,
  listAdminFeedbacks,
  type AdminFeedbackSummary,
} from "../../api/admin";
import SiteChrome from "../../components/SiteChrome";

export default function AdminFeedbackListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminFeedbackSummary[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      if (!getAdminToken()) {
        navigate("/admin/login", { replace: true });
        return;
      }

      try {
        const response = await listAdminFeedbacks();
        if (!cancelled) {
          setItems(response.items);
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
  }, [navigate]);

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
        <p className="hero-copy">集中查看全部匿名反馈，进入详情页回复、改状态并公开到回音壁。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="admin-list">
        {items.map((item) => (
          <Link className="admin-row" key={item.id} to={`/admin/feedbacks/${item.id}`}>
            <div>
              <strong>{item.thread_code}</strong>
              <p>{item.category}</p>
            </div>
            <span className="status-pill">{item.status}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
