import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createFeedback } from "../api/feedbacks";
import { isCooldownActive, markSubmissionTime } from "../lib/cooldown";
import { containsSensitiveWord } from "../lib/sensitiveWords";

export default function VentSubmitPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("engineering_process");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("请先写下你观察到的问题。");
      return;
    }

    if (containsSensitiveWord(content)) {
      setError("内容包含不适宜表达，请调整措辞后重试。");
      return;
    }

    if (isCooldownActive(Date.now())) {
      setError("10 分钟内只能提交 1 次，请稍后再试。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createFeedback({
        type: "vent",
        category,
        content_markdown: content.trim(),
      });
      markSubmissionTime(Date.now());
      navigate(`/success/${response.thread_code}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="form-panel">
        <div className="panel-header">
          <Link className="ghost-link" to="/">
            返回首页
          </Link>
          <h1>我要吐槽</h1>
          <p>聚焦当前最真实、最阻塞工作流的问题。可匿名，可追踪。</p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>分类</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="engineering_process">研发流程</option>
              <option value="tooling_efficiency">工具效能</option>
              <option value="team_culture">团队文化</option>
              <option value="collaboration">协作卡点</option>
              <option value="technical_debt">技术债</option>
            </select>
          </label>

          <label className="field">
            <span>问题描述</span>
            <textarea
              rows={8}
              placeholder="写下你观察到的问题、情境和影响。500 字以内。"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={500}
            />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="form-footer">
            <span className="helper-copy">{content.length}/500</span>
            <button className="primary-button vent-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "加密传输中..." : "加密提交"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
