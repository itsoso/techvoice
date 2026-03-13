import { Link, useParams } from "react-router-dom";

export default function SuccessPage() {
  const { threadCode } = useParams();

  return (
    <main className="page-shell narrow-shell">
      <section className="success-panel">
        <p className="mono-kicker">Transmission complete</p>
        <h1>你的声音已加密送达</h1>
        <p className="hero-copy">
          请保存下方追踪码。它是后续查看官方回复和继续匿名补充信息的唯一凭证。
        </p>
        <div className="thread-card">{threadCode}</div>
        <div className="hero-footer">
          <Link className="ghost-link" to={`/track/${threadCode}`}>
            立即查看时间线
          </Link>
          <Link className="ghost-link" to="/">
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
