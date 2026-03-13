import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { adminLogin, setAdminToken } from "../../api/admin";
import SiteChrome from "../../components/SiteChrome";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await adminLogin(username, password);
      setAdminToken(response.access_token);
      navigate("/admin/feedbacks");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "管理员登录" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>管理员登录</h1>
          <p>使用本地管理员账号进入匿名反馈看板。</p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>用户名</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          <label className="field">
            <span>密码</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="form-footer">
            <span className="helper-copy">默认账号将在后端 seed 脚本中生成</span>
            <button className="primary-button proposal-button" type="submit">
              进入看板
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
