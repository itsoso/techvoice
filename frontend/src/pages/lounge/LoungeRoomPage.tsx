import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  buildParticipantWebSocketUrl,
  enterLounge,
  type LoungeEnterResponse,
  type LoungeTicketResponse,
} from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";
import { getSavedLoungeTicket } from "../../lib/loungeTickets";

type RoomMessage = {
  id: string;
  senderType: "participant" | "executive";
  senderLabel: string;
  content: string;
};

type RoomPhase = "booting" | "waiting" | "active";

export default function LoungeRoomPage() {
  const { tenantSlug = "", eventId = "" } = useParams();
  const [ticket] = useState<LoungeTicketResponse | null>(() => getSavedLoungeTicket(tenantSlug, eventId));
  const [enterResult, setEnterResult] = useState<LoungeEnterResponse | null>(null);
  const [phase, setPhase] = useState<RoomPhase>("booting");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [executiveName, setExecutiveName] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ticket) {
      setError("当前浏览器没有这场活动的本地票据，请先返回抢票。");
      return undefined;
    }
    const savedTicket = ticket;

    let cancelled = false;

    async function connectRoom() {
      try {
        const entered = await enterLounge(tenantSlug, eventId, savedTicket);
        if (cancelled) {
          return;
        }

        setEnterResult(entered);
        const socket = new WebSocket(buildParticipantWebSocketUrl(tenantSlug, eventId, savedTicket));
        socketRef.current = socket;

        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data) as Record<string, string | number>;
          if (payload.type === "waiting") {
            setPhase("waiting");
            return;
          }

          if (payload.type === "session_claimed") {
            setPhase("active");
            setExecutiveName(String(payload.executive_name ?? ""));
            return;
          }

          if (payload.type === "event_closed") {
            setPhase("waiting");
            setError("本场活动已结束，会客厅已关闭。");
            return;
          }

          if (payload.type === "message_sent") {
            setMessages((current) => [
              ...current,
              {
                id: `${payload.sender_type}-${Date.now()}-${current.length}`,
                senderType: String(payload.sender_type) === "executive" ? "executive" : "participant",
                senderLabel: String(payload.sender_label ?? payload.sender_type ?? "匿名用户"),
                content: String(payload.content ?? ""),
              },
            ]);
          }
        };

        socket.onclose = () => {
          if (!cancelled) {
            setError((current) => current || "会客厅连接已关闭。");
          }
        };
      } catch (roomError) {
        if (!cancelled) {
          setError(roomError instanceof Error ? roomError.message : "进入会客厅失败");
        }
      }
    }

    void connectRoom();
    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
  }, [eventId, tenantSlug, ticket]);

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!socketRef.current || phase !== "active" || !enterResult) {
      return;
    }

    const content = draft.trim();
    if (!content) {
      return;
    }

    socketRef.current.send(JSON.stringify({ type: "send_message", content }));
    setMessages((current) => [
      ...current,
      {
        id: `participant-${Date.now()}`,
        senderType: "participant",
        senderLabel: ticket?.alias_label ?? "匿名用户",
        content,
      },
    ]);
    setDraft("");
  }

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
          { label: "匿名会客厅" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>匿名会客厅</h1>
          <p>只有抢到票的浏览器可以进入。你的入场票据只保存在 localStorage 中，不会同步到服务器或其他设备。</p>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        {ticket ? (
          <div className="lounge-room-layout">
            <aside className="detail-card">
              <span className="mono-kicker">Local ticket</span>
              <h2>{ticket.alias_label}</h2>
              <div className="thread-card">{ticket.ticket_code}</div>
              <p className="helper-copy storage-scope-note">只保存在当前浏览器的 localStorage 中。</p>
              <div className="status-pill-row">
                <span className="status-pill">{phase === "active" ? "已接单" : "等待接单"}</span>
              </div>
              {executiveName ? <p className="helper-copy">当前对接：{executiveName}</p> : null}
              <Link className="ghost-link" to={`/t/${tenantSlug}/lounge/${eventId}/ticket`}>
                返回票据页
              </Link>
            </aside>

            <section className="detail-card lounge-chat-panel">
              <div className="chat-panel-header">
                <div>
                  <h2>实时对话</h2>
                  <p>{phase === "active" ? "管理员已接单，可以继续匿名多轮对话。" : "进入公共待接单池后，在线高管/HR 会实时认领。"}</p>
                </div>
                {enterResult ? <span className="helper-copy">会话 #{enterResult.session_id}</span> : null}
              </div>

              <div className="chat-message-list" role="log">
                {messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <p>{phase === "active" ? "对话已建立，开始你的第一条匿名消息。" : "你已进入匿名待接单池，等待高管/HR 接单。"}</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <article
                      className={`chat-message-card chat-message-${message.senderType}`}
                      key={message.id}
                    >
                      <strong>{message.senderLabel}</strong>
                      <p>{message.content}</p>
                    </article>
                  ))
                )}
              </div>

              <form className="chat-compose" onSubmit={handleSend}>
                <label className="field">
                  <span>继续匿名发言</span>
                  <textarea
                    disabled={phase !== "active"}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={phase === "active" ? "补充细节、继续追问、确认结论" : "高管/HR 接单后这里会解锁"}
                    rows={4}
                    value={draft}
                  />
                </label>
                <div className="form-footer">
                  <span className="helper-copy">你的真实身份不会写入本场会话记录。</span>
                  <button className="primary-button proposal-button" disabled={phase !== "active"} type="submit">
                    发送匿名消息
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : (
          <section className="detail-card">
            <p className="helper-copy">当前浏览器里还没有这场活动的票据。</p>
            <Link className="ghost-link" to={`/t/${tenantSlug}/lounge/${eventId}/ticket`}>
              去抢票页
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
