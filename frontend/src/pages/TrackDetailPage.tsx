import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getFeedback, replyToFeedback, type FeedbackDetail } from "../api/feedbacks";

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
      <section className="form-panel">
        <div className="panel-header">
          <Link className="ghost-link" to="/track">
            返回查询
          </Link>
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
