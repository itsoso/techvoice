import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getAdminFeedback,
  publishAdminFeedback,
  replyAdminFeedback,
  updateAdminFeedbackStatus,
} from "../../api/admin";
import type { FeedbackDetail } from "../../api/feedbacks";

export default function AdminFeedbackDetailPage() {
  const { feedbackId = "" } = useParams();
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("reviewing");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await getAdminFeedback(feedbackId);
    setFeedback(response);
    setStatus(response.status);
  }

  useEffect(() => {
    void refresh().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    });
  }, [feedbackId]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await replyAdminFeedback(feedbackId, reply);
    setReply("");
    await refresh();
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateAdminFeedbackStatus(feedbackId, status, reason);
    await refresh();
  }

  async function handlePublish() {
    await publishAdminFeedback(feedbackId);
    await refresh();
  }

  return (
    <main className="page-shell">
      <section className="form-panel">
        <div className="panel-header">
          <Link className="ghost-link" to="/admin/feedbacks">
            返回列表
          </Link>
          <h1>反馈详情</h1>
          <p>{feedback?.thread_code}</p>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        {feedback ? (
          <>
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
                <span>管理员回复</span>
                <textarea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} />
              </label>
              <button className="primary-button proposal-button" type="submit">
                发送回复
              </button>
            </form>

            <form className="stack-form" onSubmit={handleStatusUpdate}>
              <label className="field">
                <span>状态</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="reviewing">reviewing</option>
                  <option value="needs_info">needs_info</option>
                  <option value="accepted">accepted</option>
                  <option value="deferred">deferred</option>
                </select>
              </label>
              <label className="field">
                <span>备注</span>
                <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <div className="form-footer">
                <button className="primary-button vent-button" type="submit">
                  更新状态
                </button>
                <button className="ghost-button" onClick={() => void handlePublish()} type="button">
                  发布到回音壁
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
