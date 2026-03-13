import SiteChrome from "../components/SiteChrome";

const CODEBASE_SNAPSHOT = [
  { label: "前端源码", value: "2,104 行", detail: "React + Vite + TypeScript" },
  { label: "前端测试", value: "724 行", detail: "Vitest + Testing Library" },
  { label: "后端应用", value: "915 行", detail: "FastAPI + SQLAlchemy" },
  { label: "后端测试", value: "335 行", detail: "Pytest 接口回归" },
] as const;

const ARCHITECTURE_BLOCKS = [
  {
    title: "前端交互层",
    copy: "Vite 驱动的 React 单页应用，负责匿名提交、追踪查询、公开回音壁、管理员操作和主题切换。",
  },
  {
    title: "API 与鉴权层",
    copy: "FastAPI 提供员工侧、公开侧和管理员侧接口；管理员通过 JWT 登录，员工侧保持匿名提交与查询。",
  },
  {
    title: "数据与状态层",
    copy: "SQLite 持久化反馈主表、时间线事件、管理员账号和回音壁点赞；状态围绕 received、reviewing、published 等节点流转。",
  },
  {
    title: "部署与交付层",
    copy: "Nginx 提供 HTTPS 入口与静态资源分发，后端服务独立运行，前后端通过同源 /api/v1 通信。",
  },
] as const;

const FEATURE_GROUPS = [
  {
    title: "员工端",
    items: ["匿名吐槽提交", "结构化提案提交", "追踪码成功页", "匿名补充与追踪时间线"],
  },
  {
    title: "回音壁",
    items: ["公开反馈列表", "完整展示公开内容", "管理员回复透出", "匿名点赞去重"],
  },
  {
    title: "管理员端",
    items: ["账号登录", "反馈看板筛选", "详情回复与状态变更", "发布到回音壁"],
  },
  {
    title: "数据结构",
    items: ["admins 管理员表", "feedbacks 反馈主表", "feedback_events 时间线表", "stars 点赞去重表"],
  },
] as const;

export default function ArchitecturePage() {
  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "系统架构" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Platform map and implementation snapshot</p>
        <h1 className="section-title">系统架构</h1>
        <p className="hero-copy">
          当前站点采用前后端分离的 Python 技术栈实现，围绕匿名反馈提交、管理员处理、公开回音壁与全站主题切换组织。
        </p>
      </section>

      <section className="architecture-stat-grid" aria-label="代码行数快照">
        {CODEBASE_SNAPSHOT.map((metric) => (
          <article className="architecture-stat-card" key={metric.label}>
            <p className="mono-kicker">代码行数快照</p>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="architecture-grid">
        {ARCHITECTURE_BLOCKS.map((block) => (
          <article className="info-card" key={block.title}>
            <p className="mono-kicker">Architecture</p>
            <h2>{block.title}</h2>
            <p>{block.copy}</p>
          </article>
        ))}
      </section>

      <section className="architecture-grid">
        {FEATURE_GROUPS.map((group) => (
          <article className="info-card" key={group.title}>
            <p className="mono-kicker">Capability</p>
            <h2>{group.title}</h2>
            <ul className="bullet-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
