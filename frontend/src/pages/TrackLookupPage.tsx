import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteChrome from "../components/SiteChrome";

export default function TrackLookupPage() {
  const navigate = useNavigate();
  const [threadCode, setThreadCode] = useState("");

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
