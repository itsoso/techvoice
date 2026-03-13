import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteChrome from "../components/SiteChrome";
import { readSavedThreadCodes } from "../lib/threadCodes";

export default function TrackLookupPage() {
  const navigate = useNavigate();
  const [threadCode, setThreadCode] = useState("");
  const savedThreadCodes = useMemo(() => readSavedThreadCodes(), []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!threadCode.trim()) {
      return;
    }
    navigate(`/track/${threadCode.trim()}`);
  }

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "查询追踪" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>查询追踪码</h1>
          <p>输入提交成功后保存的 thread code，查看当前状态、官方回复和后续进展。</p>
        </div>

        {savedThreadCodes.length > 0 ? (
          <section className="saved-thread-panel" aria-label="本机保存的匿名编码">
            <div className="saved-thread-header">
              <h2>我发过的匿名编码</h2>
              <p>这些编码只保存在当前浏览器的 localStorage 中，不会同步到服务器或其他设备。</p>
            </div>
            <div className="saved-thread-list">
              {savedThreadCodes.map((savedThreadCode) => (
                <button
                  className="saved-thread-chip"
                  key={savedThreadCode}
                  onClick={() => navigate(`/track/${savedThreadCode}`)}
                  type="button"
                >
                  {savedThreadCode}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Thread Code</span>
            <input
              placeholder="例如 ECH-AB12CD"
              value={threadCode}
              onChange={(event) => setThreadCode(event.target.value.toUpperCase())}
            />
          </label>

          <div className="form-footer">
            <span className="helper-copy">这是匿名沟通的唯一追踪凭证</span>
            <button className="primary-button proposal-button" type="submit">
              查询时间线
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
