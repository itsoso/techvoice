import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createFeedback } from "../api/feedbacks";
import { isCooldownActive, markSubmissionTime } from "../lib/cooldown";
import { containsSensitiveWord } from "../lib/sensitiveWords";

export default function ProposalSubmitPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("engineering_process");
  const [problem, setProblem] = useState("");
  const [impact, setImpact] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!problem.trim() || !impact.trim() || !suggestion.trim()) {
      setError("请完整填写现象、影响和建议方案。");
      return;
    }

    const combined = `${problem}\n${impact}\n${suggestion}`;
    if (containsSensitiveWord(combined)) {
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
        type: "proposal",
        category,
        proposal_problem: problem.trim(),
        proposal_impact: impact.trim(),
        proposal_suggestion: suggestion.trim(),
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
          <h1>我有提案</h1>
          <p>把问题拆解清楚，让你的建议可以被理解、被比较、被采纳。</p>
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
            <span>观察到的现象</span>
            <textarea rows={3} value={problem} onChange={(event) => setProblem(event.target.value)} />
          </label>

          <label className="field">
            <span>带来的影响</span>
            <textarea rows={3} value={impact} onChange={(event) => setImpact(event.target.value)} />
          </label>

          <label className="field">
            <span>我的建议方案</span>
            <textarea rows={4} value={suggestion} onChange={(event) => setSuggestion(event.target.value)} />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="form-footer">
            <span className="helper-copy">提案类会进入结构化评估流程</span>
            <button className="primary-button proposal-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "加密传输中..." : "加密提交"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
