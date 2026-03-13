import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import SiteChrome from "../components/SiteChrome";
import { saveThreadCode } from "../lib/threadCodes";

export default function SuccessPage() {
  const { threadCode } = useParams();

  useEffect(() => {
    if (!threadCode) {
      return;
    }

    saveThreadCode(threadCode);
  }, [threadCode]);

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "提交成功" },
        ]}
      />

      <section className="success-panel">
        <p className="mono-kicker">Transmission complete</p>
        <h1>你的声音已加密送达</h1>
        <p className="hero-copy">
          请保存下方追踪码。它是后续查看官方回复和继续匿名补充信息的唯一凭证。
        </p>
        <div className="thread-card">{threadCode}</div>
        <p className="helper-copy storage-scope-note">
          该匿名编码只保存在当前浏览器的 localStorage 中，不会同步到服务器或其他设备。
        </p>
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
