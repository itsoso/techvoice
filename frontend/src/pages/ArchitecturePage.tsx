import SiteChrome from "../components/SiteChrome";
import { CODEBASE_SCOPE, CODEBASE_SNAPSHOT, CODEBASE_TOTAL } from "../generated/codebaseSnapshot";

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

const DATABASE_TABLES = [
  {
    name: "admins",
    summary: "管理员账户表，存登录凭证和启用状态。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["username", "VARCHAR(50)", "管理员登录名，唯一"],
      ["password_hash", "VARCHAR(255)", "bcrypt 哈希密码"],
      ["display_name", "VARCHAR(100)", "展示名称"],
      ["is_active", "BOOLEAN", "是否可登录"],
      ["created_at", "DATETIME", "创建时间"],
    ],
  },
  {
    name: "feedbacks",
    summary: "匿名反馈主表，承载吐槽、提案、状态和公开回音壁信息。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["thread_code", "VARCHAR(32)", "员工追踪码，唯一"],
      ["public_code", "VARCHAR(32)", "公开回音壁编码，唯一"],
      ["type", "ENUM", "vent 或 proposal"],
      ["content_markdown", "TEXT", "吐槽正文"],
      ["proposal_problem", "TEXT", "提案里的现象"],
      ["proposal_impact", "TEXT", "提案里的影响"],
      ["proposal_suggestion", "TEXT", "提案里的建议"],
      ["category", "VARCHAR(50)", "分类标签"],
      ["status", "ENUM", "received / reviewing / published 等状态"],
      ["is_public", "BOOLEAN", "是否已公开到回音壁"],
      ["star_count", "INTEGER", "公开点赞数"],
      ["created_at", "DATETIME", "创建时间"],
      ["updated_at", "DATETIME", "最后更新时间"],
    ],
  },
  {
    name: "feedback_events",
    summary: "时间线事件表，保存系统提示、员工补充、管理员回复与状态变更。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["feedback_id", "INTEGER", "关联 feedbacks.id"],
      ["actor_type", "ENUM", "system / employee / admin"],
      ["event_type", "ENUM", "submitted / reply / status_changed / published"],
      ["content", "TEXT", "时间线文本内容"],
      ["meta_json", "JSON", "状态切换等补充信息"],
      ["created_at", "DATETIME", "事件发生时间"],
    ],
  },
  {
    name: "stars",
    summary: "回音壁点赞去重表，用匿名指纹限制重复点赞。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["feedback_id", "INTEGER", "关联公开反馈"],
      ["client_fingerprint", "VARCHAR(255)", "匿名客户端指纹"],
      ["created_at", "DATETIME", "点赞时间"],
    ],
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
        <article className="architecture-stat-card" key={CODEBASE_TOTAL.label}>
          <p className="mono-kicker">完整仓库快照</p>
          <strong>{CODEBASE_TOTAL.value}</strong>
          <span>{CODEBASE_TOTAL.label}</span>
          <p>{CODEBASE_TOTAL.detail}</p>
        </article>
      </section>
      <p className="helper-copy">{CODEBASE_SCOPE}</p>

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

      <section className="schema-panel">
        <div className="schema-panel-header">
          <p className="mono-kicker">Database</p>
          <h2>数据库表结构</h2>
          <p>当前 MVP 使用 4 张核心表覆盖管理员登录、匿名反馈、沟通时间线和回音壁点赞。</p>
        </div>

        <div className="schema-grid">
          {DATABASE_TABLES.map((table) => (
            <article className="schema-card" key={table.name}>
              <div className="schema-card-header">
                <strong>{table.name}</strong>
                <p>{table.summary}</p>
              </div>

              <div className="schema-table-wrap">
                <table className="schema-table">
                  <thead>
                    <tr>
                      <th>字段</th>
                      <th>类型</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map(([field, type, description]) => (
                      <tr key={field}>
                        <td>{field}</td>
                        <td>{type}</td>
                        <td>{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
