import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { registerExecutive } from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";

export default function ExecutiveRegisterPage() {
  const { tenantSlug = "" } = useParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await registerExecutive(tenantSlug, form);
      setSuccess("注册申请已提交，等待租户管理员授权后即可进入接单台。");
      setForm({ name: "", email: "", title: "", password: "" });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "提交申请失败");
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
          { label: "高管注册" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>高管 / HR 注册</h1>
          <p>会客厅接待方需要实名注册，并由租户管理员授权后才能实时接单。</p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>姓名</span>
            <input onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
          </label>
          <label className="field">
            <span>邮箱</span>
            <input onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} value={form.email} />
          </label>
          <label className="field">
            <span>职位</span>
            <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} value={form.title} />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              type="password"
              value={form.password}
            />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}
          {success ? <p className="success-banner">{success}</p> : null}

          <div className="form-footer">
            <Link className="ghost-link" to={`/t/${tenantSlug}/executive/login`}>
              已有账号，去登录
            </Link>
            <button className="primary-button proposal-button" type="submit">
              提交实名申请
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
