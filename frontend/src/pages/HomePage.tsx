import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="mono-kicker">No IP. No User-Agent. Just your voice.</p>
        <h1>Echo｜TechVoice</h1>
        <p className="hero-copy">
          一个为技术团队设计的匿名沟通入口。表达真实问题，留下建设性提案，并通过追踪码持续跟进。
        </p>
      </section>

      <section className="card-grid">
        <Link className="entry-card entry-card-vent" to="/submit/vent">
          <span className="entry-badge">01</span>
          <h2>我要吐槽</h2>
          <p>流程太卡、协作太慢、技术债堆积。把现场感最强的问题直接说出来。</p>
        </Link>

        <Link className="entry-card entry-card-proposal" to="/submit/proposal">
          <span className="entry-badge">02</span>
          <h2>我有提案</h2>
          <p>把观察、影响和建议整理成结构化方案，让管理动作更容易发生。</p>
        </Link>
      </section>

      <section className="hero-footer">
        <Link className="ghost-link" to="/track">
          查询追踪码
        </Link>
        <Link className="ghost-link" to="/wall">
          查看回音壁
        </Link>
        <Link className="ghost-link" to="/admin/login">
          管理员入口
        </Link>
      </section>
    </main>
  );
}
