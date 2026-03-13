import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  buildExecutiveWebSocketUrl,
  claimExecutiveSession,
  clearExecutiveToken,
  getExecutiveToken,
  listExecutiveQueue,
  type QueueItem,
} from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";

type SessionMessage = {
  id: string;
  senderType: "participant" | "executive";
  senderLabel: string;
  content: string;
};

type ClaimedSession = {
  sessionId: number;
  aliasLabel: string;
  messages: SessionMessage[];
};

export default function ExecutiveLoungePage() {
  const { tenantSlug = "" } = useParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [sessions, setSessions] = useState<ClaimedSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const accessToken = getExecutiveToken(tenantSlug);
  const selectedSession = useMemo(
    () => sessions.find((session) => session.sessionId === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    let cancelled = false;

    async function loadQueue() {
      try {
        const response = await listExecutiveQueue(tenantSlug);
        if (!cancelled) {
          setQueue(response.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "加载待接单池失败");
        }
      }
    }

    void loadQueue();
    const socket = new WebSocket(buildExecutiveWebSocketUrl(tenantSlug, accessToken));
    socketRef.current = socket;
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as Record<string, string | number>;
      if (payload.type === "event_closed") {
        setError("当前活动已结束，对应会话已关闭。");
        return;
      }
      if (payload.type !== "message_sent") {
        return;
      }

      const sessionId = Number(payload.session_id);
      setSessions((current) =>
        current.map((session) =>
          session.sessionId === sessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: `${payload.sender_type}-${Date.now()}-${session.messages.length}`,
                    senderType: String(payload.sender_type) === "executive" ? "executive" : "participant",
                    senderLabel: String(payload.sender_label ?? payload.sender_type ?? "匿名用户"),
                    content: String(payload.content ?? ""),
                  },
                ],
              }
            : session,
        ),
      );
    };

    socket.onclose = () => {
      if (!cancelled) {
        setError((current) => current || "接单台连接已关闭。");
      }
    };

    return () => {
      cancelled = true;
      socket.close();
    };
  }, [accessToken, tenantSlug]);

  async function handleClaim(item: QueueItem) {
    setError("");
    try {
      await claimExecutiveSession(tenantSlug, item.session_id);
      setQueue((current) => current.filter((queueItem) => queueItem.session_id !== item.session_id));
      setSessions((current) => {
        if (current.some((session) => session.sessionId === item.session_id)) {
          return current;
        }
        return [...current, { sessionId: item.session_id, aliasLabel: item.alias_label, messages: [] }];
      });
      setSelectedSessionId(item.session_id);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "接单失败");
    }
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!socketRef.current || !selectedSession) {
      return;
    }

    const content = draft.trim();
    if (!content) {
      return;
    }

    socketRef.current.send(JSON.stringify({ type: "send_message", session_id: selectedSession.sessionId, content }));
    setSessions((current) =>
      current.map((session) =>
        session.sessionId === selectedSession.sessionId
          ? {
              ...session,
              messages: [
                ...session.messages,
                {
                  id: `executive-${Date.now()}`,
                  senderType: "executive",
                  senderLabel: "我",
                  content,
                },
              ],
            }
          : session,
      ),
    );
    setDraft("");
  }

  function handleLogout() {
    clearExecutiveToken(tenantSlug);
    navigate(`/t/${tenantSlug}/executive/login`);
  }

  if (!accessToken) {
    return (
      <main className="page-shell">
        <SiteChrome
          breadcrumbs={[
            { label: "首页", to: "/" },
            { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
            { label: "高管接单台" },
          ]}
        />
        <section className="form-panel">
          <div className="panel-header">
            <h1>高管接单台</h1>
            <p>需要先登录已授权的高管 / HR 账号。</p>
          </div>
          <div className="form-footer">
            <Link className="ghost-link" to={`/t/${tenantSlug}/executive/register`}>
              去注册
            </Link>
            <Link className="primary-button proposal-button" to={`/t/${tenantSlug}/executive/login`}>
              去登录
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
          { label: "高管接单台" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Executive console</p>
        <h1 className="section-title">高管接单台</h1>
        <p className="hero-copy">公共待接单池里的匿名用户会先到先排，你可以并发认领多个会话并进行实时多轮沟通。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="lounge-console-grid">
        <aside className="detail-card queue-panel">
          <div className="chat-panel-header">
            <div>
              <h2>待接单池</h2>
              <p>实时连接已建立，支持手动刷新并认领多个匿名会话。</p>
            </div>
            <button className="ghost-button" onClick={handleLogout} type="button">
              退出高管账号
            </button>
          </div>

          <div className="queue-list">
            {queue.length === 0 ? (
              <div className="chat-empty-state">
                <p>当前没有待接单匿名用户。</p>
              </div>
            ) : (
              queue.map((item) => (
                <article className="queue-item-card" key={item.session_id}>
                  <div>
                    <strong>{item.alias_label}</strong>
                    <p className="helper-copy">会话 #{item.session_id}</p>
                  </div>
                  <button className="primary-button proposal-button" onClick={() => void handleClaim(item)} type="button">
                    接单
                  </button>
                </article>
              ))
            )}
          </div>
        </aside>

        <section className="detail-card lounge-chat-panel">
          <div className="chat-panel-header">
            <div>
              <h2>我正在处理的会话</h2>
              <p>单个高管支持并发处理多个会话，点击左侧标签切换当前对话。</p>
            </div>
          </div>

          <div className="claimed-session-tabs">
            {sessions.map((session) => (
              <button
                className={`saved-thread-chip${selectedSessionId === session.sessionId ? " claimed-session-chip-active" : ""}`}
                key={session.sessionId}
                onClick={() => setSelectedSessionId(session.sessionId)}
                type="button"
              >
                {session.aliasLabel}
              </button>
            ))}
          </div>

          <div className="chat-message-list" role="log">
            {!selectedSession ? (
              <div className="chat-empty-state">
                <p>从左侧待接单池认领一个匿名用户后，这里会展示实时消息。</p>
              </div>
            ) : selectedSession.messages.length === 0 ? (
              <div className="chat-empty-state">
                <p>{selectedSession.aliasLabel} 已接单，等待对方发来第一条消息。</p>
              </div>
            ) : (
              selectedSession.messages.map((message) => (
                <article className={`chat-message-card chat-message-${message.senderType}`} key={message.id}>
                  <strong>{message.senderLabel}</strong>
                  <p>{message.content}</p>
                </article>
              ))
            )}
          </div>

          <form className="chat-compose" onSubmit={handleSend}>
            <label className="field">
              <span>发送回复</span>
              <textarea
                disabled={!selectedSession}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={selectedSession ? "给出答复、追问细节、确认下一步" : "先从待接单池认领一个会话"}
                rows={4}
                value={draft}
              />
            </label>
            <div className="form-footer">
              <span className="helper-copy">会话结束后会自动归档到当前租户的活动记录中。</span>
              <button className="primary-button proposal-button" disabled={!selectedSession} type="submit">
                发送回复
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
