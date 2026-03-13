import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getCurrentLoungeEvent, type LoungeEvent } from "../../api/lounge";
import SiteChrome from "../../components/SiteChrome";

export default function LoungeLandingPage() {
  const { tenantSlug = "" } = useParams();
  const [event, setEvent] = useState<LoungeEvent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const currentEvent = await getCurrentLoungeEvent(tenantSlug);
        if (!cancelled) {
          setEvent(currentEvent);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "加载活动失败");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "限时匿名会客厅" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Limited anonymous lounge</p>
        <h1 className="section-title">限时匿名会客厅</h1>
        <p className="hero-copy">小流量、强实时的匿名会谈模式。抢到票后，活动开始时可进入匿名待接单池。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      {event ? (
        <section className="form-panel">
          <div className="panel-header">
            <h2>{event.title}</h2>
            <p>{event.description}</p>
          </div>

          <div className="detail-grid">
            <div className="field">
              <span>抢票开放</span>
              <p className="detail-copy">{new Date(event.ticket_open_at).toLocaleString()}</p>
            </div>
            <div className="field">
              <span>正式开始</span>
              <p className="detail-copy">{new Date(event.start_at).toLocaleString()}</p>
            </div>
            <div className="field">
              <span>活动结束</span>
              <p className="detail-copy">{new Date(event.end_at).toLocaleString()}</p>
            </div>
            <div className="field">
              <span>限量名额</span>
              <p className="detail-copy">{event.ticket_limit} 席</p>
            </div>
          </div>

          <div className="form-footer">
            <span className="helper-copy">本次活动按当前浏览器抢票和入场，不绑定真实员工身份。</span>
            <Link className="primary-button proposal-button" to={`/t/${tenantSlug}/lounge/${event.id}/ticket`}>
              进入抢票
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
