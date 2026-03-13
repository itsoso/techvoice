import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { executiveLogin, setExecutiveToken } from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";

export default function ExecutiveLoginPage() {
  const { tenantSlug = "" } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await executiveLogin(tenantSlug, email, password);
      setExecutiveToken(tenantSlug, response.access_token);
      navigate(`/t/${tenantSlug}/executive/lounge`);
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
          { label: "高管登录" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>高管 / HR 登录</h1>
          <p>只有已被租户管理员授权的实名账号，才能进入匿名会客厅接单台。</p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>邮箱</span>
            <input onChange={(event) => setEmail(event.target.value)} value={email} />
          </label>
          <label className="field">
            <span>密码</span>
            <input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="form-footer">
            <Link className="ghost-link" to={`/t/${tenantSlug}/executive/register`}>
              还没有账号，去注册
            </Link>
            <button className="primary-button proposal-button" type="submit">
              进入接单台
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
