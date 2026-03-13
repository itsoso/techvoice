import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getFeedback, replyToFeedback, type FeedbackDetail } from "../api/feedbacks";
import SiteChrome from "../components/SiteChrome";

function getSubmissionContent(feedback: FeedbackDetail) {
  if (feedback.type === "proposal") {
    return [
      feedback.proposal_problem && `观察到的现象\n${feedback.proposal_problem}`,
      feedback.proposal_impact && `带来的影响\n${feedback.proposal_impact}`,
      feedback.proposal_suggestion && `我的建议方案\n${feedback.proposal_suggestion}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return feedback.content_markdown ?? "";
}

export default function TrackDetailPage() {
  const { threadCode = "" } = useParams();
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      try {
        const response = await getFeedback(threadCode);
        if (!cancelled) {
          setFeedback(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "加载失败");
        }
      }
    }

    void loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [threadCode]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await replyToFeedback(threadCode, reply.trim());
      const refreshed = await getFeedback(threadCode);
      setFeedback(refreshed);
      setReply("");
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "回复失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "查询追踪", to: "/track" },
          { label: "匿名沟通时间线" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>匿名沟通时间线</h1>
          <p>{threadCode}</p>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        {feedback ? (
          <>
            <div className="status-pill-row">
              <span className="status-pill">{feedback.status}</span>
              <span className="helper-copy">{feedback.category}</span>
            </div>

            {getSubmissionContent(feedback) ? (
              <section className="detail-card">
                <p className="mono-kicker">Initial Submission</p>
                <h2>你的原始提交</h2>
                <p className="detail-copy">{getSubmissionContent(feedback)}</p>
              </section>
            ) : null}

            <ol className="timeline-list">
              {feedback.events.map((event, index) => (
                <li className="timeline-item" key={`${event.created_at}-${index}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <strong>{event.actor_type}</strong>
                    <p>{event.content ?? String(event.meta_json?.status ?? "状态更新")}</p>
                  </div>
                </li>
              ))}
            </ol>

            <form className="stack-form" onSubmit={handleReply}>
              <label className="field">
                <span>继续匿名补充</span>
                <textarea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} />
              </label>
              <div className="form-footer">
                <span className="helper-copy">如果管理员要求补充信息，这里会成为新的时间线事件。</span>
                <button className="primary-button proposal-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "发送中..." : "匿名补充"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <p className="helper-copy">加载中...</p>
        )}
      </section>
    </main>
  );
}
