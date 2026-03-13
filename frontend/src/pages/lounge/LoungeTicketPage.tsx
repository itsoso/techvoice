import { useState } from "react";
import { useParams } from "react-router-dom";

import { claimLoungeTicket } from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";
import { getSavedLoungeTicket, saveLoungeTicket } from "../../lib/loungeTickets";

export default function LoungeTicketPage() {
  const { tenantSlug = "", eventId = "" } = useParams();
  const [ticket, setTicket] = useState(() => getSavedLoungeTicket(tenantSlug, eventId));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    setLoading(true);
    setError("");

    try {
      const claimed = await claimLoungeTicket(tenantSlug, eventId);
      saveLoungeTicket(tenantSlug, eventId, claimed);
      setTicket(claimed);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "抢票失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅", to: `/t/${tenantSlug}/lounge` },
          { label: "抢票" },
        ]}
      />

      <section className="form-panel">
        <div className="panel-header">
          <h1>抢限时入场券</h1>
          <p>抢到后会为你生成匿名代号和入场票据，活动开始时即可进入匿名会客厅。</p>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        {ticket ? (
          <section className="success-panel">
            <p className="mono-kicker">Ticket locked</p>
            <h2>{ticket.alias_label}</h2>
            <div className="thread-card">{ticket.ticket_code}</div>
            <p className="helper-copy storage-scope-note">
              该票据只保存在当前浏览器的 localStorage 中，不会同步到服务器或其他设备。
            </p>
          </section>
        ) : (
          <div className="form-footer">
            <span className="helper-copy">抢票资格仅和当前浏览器绑定，不记录你的真实员工身份。</span>
            <button className="primary-button proposal-button" disabled={loading} onClick={() => void handleClaim()} type="button">
              {loading ? "抢票中..." : "立即抢票"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
