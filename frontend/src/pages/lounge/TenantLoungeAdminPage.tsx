import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  approveTenantExecutive,
  clearTenantAdminToken,
  createTenantLoungeEvent,
  getTenantAdminToken,
  listTenantExecutives,
  listTenantLoungeEvents,
  type ExecutiveRead,
  type LoungeEvent,
} from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";

function toIsoLocalDateTime(value: string) {
  return new Date(value).toISOString();
}

export default function TenantLoungeAdminPage() {
  const { tenantSlug = "" } = useParams();
  const navigate = useNavigate();
  const [executives, setExecutives] = useState<ExecutiveRead[]>([]);
  const [events, setEvents] = useState<LoungeEvent[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    ticket_open_at: "",
    start_at: "",
    end_at: "",
    ticket_limit: "5",
  });
  const token = getTenantAdminToken(tenantSlug);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [executiveResponse, eventResponse] = await Promise.all([
          listTenantExecutives(tenantSlug),
          listTenantLoungeEvents(tenantSlug),
        ]);
        if (!cancelled) {
          setExecutives(executiveResponse.items);
          setEvents(eventResponse.items);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "加载租户会客厅配置失败");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, token]);

  async function handleApprove(executiveId: number) {
    setError("");
    try {
      const approved = await approveTenantExecutive(tenantSlug, executiveId);
      setExecutives((current) =>
        current.map((item) => (item.id === executiveId ? approved : item)),
      );
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "授权失败");
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const created = await createTenantLoungeEvent(tenantSlug, {
        title: form.title,
        description: form.description,
        ticket_open_at: toIsoLocalDateTime(form.ticket_open_at),
        start_at: toIsoLocalDateTime(form.start_at),
        end_at: toIsoLocalDateTime(form.end_at),
        ticket_limit: Number(form.ticket_limit),
      });
      setEvents((current) => [created, ...current]);
      setSuccess("活动已创建。员工现在可以在租户活动页查看并参与抢票。");
      setForm({
        title: "",
        description: "",
        ticket_open_at: "",
        start_at: "",
        end_at: "",
        ticket_limit: "5",
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建活动失败");
    }
  }

  function handleLogout() {
    clearTenantAdminToken(tenantSlug);
    navigate(`/t/${tenantSlug}/admin/login`);
  }

  if (!token) {
    return (
      <main className="page-shell">
        <SiteChrome
          breadcrumbs={[
            { label: "首页", to: "/" },
            { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
            { label: "租户管理员控制台" },
          ]}
        />
        <section className="form-panel">
          <div className="panel-header">
            <h1>租户管理员控制台</h1>
            <p>需要先登录租户管理员账号。</p>
          </div>
          <div className="form-footer">
            <span className="helper-copy">一个租户对应一个公司/客户实例，所有活动和权限都在租户内隔离。</span>
            <Link className="primary-button proposal-button" to={`/t/${tenantSlug}/admin/login`}>
              去登录
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
          { label: "租户管理员控制台" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Tenant operations</p>
        <h1 className="section-title">租户管理员控制台</h1>
        <p className="hero-copy">在租户维度内审批高管身份、配置活动时间与票数，控制“限时匿名会客厅”的运营节奏。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}
      {success ? <p className="success-banner">{success}</p> : null}

      <section className="lounge-console-grid">
        <aside className="detail-card queue-panel">
          <div className="chat-panel-header">
            <div>
              <h2>高管授权</h2>
              <p>只有实名注册且被授权的高管 / HR 才能进入实时接单台。</p>
            </div>
            <button className="ghost-button" onClick={handleLogout} type="button">
              退出管理员
            </button>
          </div>
          <div className="queue-list">
            {executives.map((executive) => (
              <article className="queue-item-card" key={executive.id}>
                <div>
                  <strong>{executive.name}</strong>
                  <p className="helper-copy">
                    {executive.title} · {executive.email}
                  </p>
                  <p className="helper-copy">当前状态：{executive.approval_status}</p>
                </div>
                {executive.approval_status === "approved" ? (
                  <span className="status-pill">已授权</span>
                ) : (
                  <button
                    className="primary-button proposal-button"
                    onClick={() => void handleApprove(executive.id)}
                    type="button"
                  >
                    授权
                  </button>
                )}
              </article>
            ))}
          </div>
        </aside>

        <section className="detail-card lounge-chat-panel">
          <div className="chat-panel-header">
            <div>
              <h2>创建活动</h2>
              <p>配置抢票开放时间、正式活动时间和限量名额。</p>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleCreateEvent}>
            <label className="field">
              <span>活动标题</span>
              <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} value={form.title} />
            </label>
            <label className="field">
              <span>活动说明</span>
              <textarea
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                value={form.description}
              />
            </label>
            <div className="detail-grid lounge-admin-form-grid">
              <label className="field">
                <span>抢票开放</span>
                <input
                  onChange={(event) => setForm((current) => ({ ...current, ticket_open_at: event.target.value }))}
                  type="datetime-local"
                  value={form.ticket_open_at}
                />
              </label>
              <label className="field">
                <span>正式开始</span>
                <input
                  onChange={(event) => setForm((current) => ({ ...current, start_at: event.target.value }))}
                  type="datetime-local"
                  value={form.start_at}
                />
              </label>
              <label className="field">
                <span>活动结束</span>
                <input
                  onChange={(event) => setForm((current) => ({ ...current, end_at: event.target.value }))}
                  type="datetime-local"
                  value={form.end_at}
                />
              </label>
              <label className="field">
                <span>票数上限</span>
                <input
                  min="1"
                  onChange={(event) => setForm((current) => ({ ...current, ticket_limit: event.target.value }))}
                  type="number"
                  value={form.ticket_limit}
                />
              </label>
            </div>

            <div className="form-footer">
              <span className="helper-copy">建议从小流量场景开始，比如每场 5 人、每周一次。</span>
              <button className="primary-button proposal-button" type="submit">
                创建活动
              </button>
            </div>
          </form>

          <div className="queue-list">
            {events.map((event) => (
              <article className="queue-item-card" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <p className="helper-copy">{event.description}</p>
                </div>
                <span className="status-pill">{event.status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
