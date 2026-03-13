import SiteChrome from "../components/SiteChrome";
import { CODEBASE_SCOPE, CODEBASE_SNAPSHOT, CODEBASE_TOTAL } from "../generated/codebaseSnapshot";

const ARCHITECTURE_BLOCKS = [
  {
    title: "前端交互层",
    copy: "Vite 驱动的 React 单页应用，覆盖匿名反馈、追踪查询、公开回音壁、租户化匿名会客厅、高管接单台与租户管理员控制台。",
  },
  {
    title: "API 与鉴权层",
    copy: "FastAPI 提供员工侧、公开侧、全局管理员、租户管理员与高管/HR 接口；实名角色通过 JWT 登录，匿名参与者通过浏览器本地票据和短期入场 token 准入。",
  },
  {
    title: "数据与状态层",
    copy: "SQLite 持久化匿名反馈、时间线事件、多租户组织、租户管理员、高管实名审批、活动抢票、待接单会话与实时聊天消息；异步反馈和实时会客厅并存。",
  },
  {
    title: "实时会话层",
    copy: "FastAPI WebSocket 在单机内存连接管理器上承载匿名会客厅的等待入池、接单认领和多轮对话；业务状态与消息正文同步落库，方便活动结束后归档。",
  },
  {
    title: "部署与交付层",
    copy: "Nginx 提供 HTTPS 入口与静态资源分发，后端服务独立运行，前后端通过同源 /api/v1 与 /api/v1/ws 通信；架构页代码统计由脚本自动生成，避免手填失真。",
  },
] as const;

const FEATURE_GROUPS = [
  {
    title: "员工端",
    items: ["匿名吐槽提交", "结构化提案提交", "追踪码成功页", "匿名补充与追踪时间线", "限时匿名会客厅抢票与入场"],
  },
  {
    title: "回音壁",
    items: ["公开反馈列表", "完整展示公开内容", "管理员回复透出", "匿名补充透出", "匿名点赞去重"],
  },
  {
    title: "管理与接待端",
    items: ["全局管理员反馈看板", "租户管理员审批高管", "租户管理员创建活动", "高管实名注册与登录", "高管实时接单与多轮会话"],
  },
  {
    title: "多租户与实时模型",
    items: ["tenants 租户隔离", "tenant_admins 租户管理员", "executives 高管实名与审批", "lounge_events 活动配置", "lounge_tickets 抢票与匿名代号", "lounge_sessions 会话认领", "lounge_messages 实时消息归档"],
  },
] as const;

const DATABASE_TABLES = [
  {
    name: "tenants",
    summary: "多租户主表，一个租户对应一个公司/客户实例。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["slug", "VARCHAR(64)", "租户路由标识，唯一"],
      ["name", "VARCHAR(255)", "公司/客户名称"],
      ["status", "ENUM", "active / inactive"],
      ["created_at", "DATETIME", "创建时间"],
    ],
  },
  {
    name: "tenant_admins",
    summary: "租户管理员表，负责审批高管和配置会客厅活动。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["tenant_id", "INTEGER", "关联 tenants.id"],
      ["username", "VARCHAR(50)", "租户管理员登录名"],
      ["password_hash", "VARCHAR(255)", "bcrypt 哈希密码"],
      ["display_name", "VARCHAR(100)", "展示名称"],
      ["is_active", "BOOLEAN", "是否可登录"],
      ["created_at", "DATETIME", "创建时间"],
    ],
  },
  {
    name: "admins",
    summary: "全局管理员账户表，用于异步匿名反馈的统一看板运营。",
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
    summary: "异步匿名反馈主表，承载吐槽、提案、状态和公开回音壁信息。",
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
    summary: "异步沟通时间线表，保存系统提示、员工补充、管理员回复与状态变更。",
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
  {
    name: "executives",
    summary: "高管 / HR 实名注册表，需被租户管理员授权后才能接单。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["tenant_id", "INTEGER", "关联 tenants.id"],
      ["name", "VARCHAR(100)", "实名姓名"],
      ["email", "VARCHAR(255)", "登录邮箱"],
      ["title", "VARCHAR(100)", "职位"],
      ["password_hash", "VARCHAR(255)", "bcrypt 哈希密码"],
      ["approval_status", "ENUM", "pending / approved / rejected"],
      ["is_active", "BOOLEAN", "是否可登录"],
      ["created_at", "DATETIME", "创建时间"],
    ],
  },
  {
    name: "lounge_events",
    summary: "限时匿名会客厅活动表，配置抢票窗口、活动时间和票数上限。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["tenant_id", "INTEGER", "关联 tenants.id"],
      ["created_by_admin_id", "INTEGER", "关联 tenant_admins.id"],
      ["title", "VARCHAR(255)", "活动标题"],
      ["description", "TEXT", "活动说明"],
      ["ticket_open_at", "DATETIME", "抢票开放时间"],
      ["start_at", "DATETIME", "正式开始时间"],
      ["end_at", "DATETIME", "结束时间"],
      ["ticket_limit", "INTEGER", "名额上限"],
      ["status", "ENUM", "draft / ticketing / live / closed / archived"],
      ["created_at", "DATETIME", "创建时间"],
    ],
  },
  {
    name: "lounge_tickets",
    summary: "匿名抢票记录表，保存浏览器指纹、匿名代号和入场票据。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["event_id", "INTEGER", "关联 lounge_events.id"],
      ["ticket_code", "VARCHAR(32)", "对外展示的票据编码"],
      ["client_fingerprint", "VARCHAR(255)", "浏览器匿名指纹"],
      ["entry_token_hash", "VARCHAR(255)", "短期入场 token"],
      ["alias_label", "VARCHAR(64)", "匿名代号，如匿名者A"],
      ["claimed_at", "DATETIME", "抢票时间"],
      ["entered_at", "DATETIME", "进场时间"],
      ["status", "ENUM", "claimed / entered / expired"],
    ],
  },
  {
    name: "lounge_sessions",
    summary: "一对一接单会话表，记录匿名参与者是否已被高管认领。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["event_id", "INTEGER", "关联 lounge_events.id"],
      ["ticket_id", "INTEGER", "关联 lounge_tickets.id"],
      ["executive_id", "INTEGER", "关联 executives.id，可为空"],
      ["status", "ENUM", "waiting / active / closed / archived"],
      ["claimed_by_executive_at", "DATETIME", "高管认领时间"],
      ["closed_at", "DATETIME", "会话关闭时间"],
      ["created_at", "DATETIME", "创建时间"],
    ],
  },
  {
    name: "lounge_messages",
    summary: "实时会客厅消息表，归档匿名用户与高管之间的多轮对话。",
    columns: [
      ["id", "INTEGER", "主键 ID"],
      ["session_id", "INTEGER", "关联 lounge_sessions.id"],
      ["sender_type", "ENUM", "participant / executive / system"],
      ["sender_label", "VARCHAR(64)", "发送方展示名"],
      ["content", "TEXT", "消息正文"],
      ["created_at", "DATETIME", "发送时间"],
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
          当前站点采用前后端分离的 Python 技术栈实现，围绕异步匿名反馈、公开回音壁、多租户限时匿名会客厅、实名高管接单与全站主题切换组织。
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
          <p>当前版本使用 11 张核心表，覆盖异步匿名反馈、多租户隔离、租户管理员、高管实名审批、会客厅活动、抢票、接单会话与实时消息归档。</p>
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
