import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  clearAdminToken,
  getAdminToken,
  getAdminFeedback,
  isAdminAuthError,
  publishAdminFeedback,
  replyAdminFeedback,
  updateAdminFeedbackStatus,
} from "../../api/admin";
import SiteChrome from "../../components/SiteChrome";
import type { FeedbackDetail, TimelineEvent } from "../../api/feedbacks";

export default function AdminFeedbackDetailPage() {
  const { feedbackId = "" } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("reviewing");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refresh() {
    const response = await getAdminFeedback(feedbackId);
    setFeedback(response);
    setStatus(response.status);
    setError("");
  }

  function getErrorMessage(actionError: unknown, fallback: string) {
    return actionError instanceof Error ? actionError.message : fallback;
  }

  function redirectToLogin() {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  }

  function appendTimelineEvent(event: TimelineEvent) {
    setFeedback((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        updated_at: event.created_at,
        events: [...current.events, event],
      };
    });
  }

  useEffect(() => {
    if (!getAdminToken()) {
      redirectToLogin();
      return;
    }

    void refresh().catch((loadError) => {
      if (isAdminAuthError(loadError)) {
        redirectToLogin();
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "加载失败");
    });
  }, [feedbackId, navigate]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!reply.trim()) {
      setError("请先填写回复内容。");
      return;
    }

    try {
      const content = reply.trim();
      await replyAdminFeedback(feedbackId, content);
      appendTimelineEvent({
        actor_type: "admin",
        event_type: "reply",
        content,
        meta_json: null,
        created_at: new Date().toISOString(),
      });
      setReply("");
    } catch (replyError) {
      if (isAdminAuthError(replyError)) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(replyError, "发送回复失败，请稍后重试。"));
    }
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateAdminFeedbackStatus(feedbackId, status, reason.trim());
      await refresh();
      setSuccess("状态已更新。");
    } catch (statusError) {
      if (isAdminAuthError(statusError)) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(statusError, "更新状态失败，请稍后重试。"));
    }
  }

  async function handlePublish() {
    setError("");
    setSuccess("");

    if (feedback?.is_public) {
      setSuccess("该反馈已发布到回音壁。");
      return;
    }

    try {
      const published = await publishAdminFeedback(feedbackId);
      setFeedback((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: published.status,
          is_public: published.is_public,
          star_count: published.star_count,
          updated_at: published.updated_at,
          events: [
            ...current.events,
            {
              actor_type: "admin",
              event_type: "published",
              content: "已公开到回音壁",
              meta_json: null,
              created_at: published.updated_at,
            },
          ],
        };
      });
      setStatus(published.status);
      setSuccess("已发布到回音壁。");
    } catch (publishError) {
      if (isAdminAuthError(publishError)) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(publishError, "发布失败，请稍后重试。"));
    }
  }

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "管理员看板", to: "/admin/feedbacks" },
          { label: "反馈详情" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <Link className="ghost-link" to="/admin/feedbacks">
            返回列表
          </Link>
          <h1>反馈详情</h1>
          <p>{feedback?.thread_code}</p>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
        {success ? (
          <p aria-live="polite" className="success-banner" role="status">
            {success}
          </p>
        ) : null}

        {feedback ? (
          <>
            <section className="detail-card">
              <p className="mono-kicker">Anonymous Submission</p>
              <h2>匿名用户提交内容</h2>
              {feedback.type === "proposal" ? (
                <div className="detail-grid">
                  <div className="field">
                    <span>观察到的现象</span>
                    <p className="detail-copy">{feedback.proposal_problem ?? "未填写"}</p>
                  </div>
                  <div className="field">
                    <span>带来的影响</span>
                    <p className="detail-copy">{feedback.proposal_impact ?? "未填写"}</p>
                  </div>
                  <div className="field">
                    <span>我的建议方案</span>
                    <p className="detail-copy">{feedback.proposal_suggestion ?? "未填写"}</p>
                  </div>
                </div>
              ) : (
                <div className="field">
                  <span>问题描述</span>
                  <p className="detail-copy">{feedback.content_markdown ?? "未填写"}</p>
                </div>
              )}
            </section>

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
                  <option value="published">published</option>
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
                <button
                  className="ghost-button"
                  disabled={feedback.is_public}
                  onClick={() => void handlePublish()}
                  type="button"
                >
                  {feedback.is_public ? "已发布到回音壁" : "发布到回音壁"}
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
