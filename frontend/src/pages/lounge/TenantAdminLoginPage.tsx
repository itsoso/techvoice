import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { setTenantAdminToken, tenantAdminLogin } from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";

export default function TenantAdminLoginPage() {
  const { tenantSlug = "" } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await tenantAdminLogin(tenantSlug, username, password);
      setTenantAdminToken(tenantSlug, response.access_token);
      navigate(`/t/${tenantSlug}/admin/lounge-events`);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
          { label: "租户管理登录" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>租户管理员登录</h1>
          <p>用于审批高管身份并配置限时匿名会客厅活动时间、票数和运营节奏。</p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>用户名</span>
            <input onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>
          <label className="field">
            <span>密码</span>
            <input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="form-footer">
            <span className="helper-copy">登录后可审批高管、创建活动、查看租户内会客厅配置。</span>
            <button className="primary-button proposal-button" type="submit">
              进入控制台
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
