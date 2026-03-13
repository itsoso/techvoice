import { useEffect, useState } from "react";

import { listPublicFeedbacks, starPublicFeedback, type PublicFeedback } from "../api/feedbacks";
import SiteChrome from "../components/SiteChrome";

const STAR_TOKEN_KEY = "techvoice-public-star-token";

function getStarToken() {
  const existing = localStorage.getItem(STAR_TOKEN_KEY);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(STAR_TOKEN_KEY, created);
  return created;
}

function renderProposalSections(item: PublicFeedback) {
  return (
    <div className="wall-content">
      <div className="wall-section">
        <h3>观察到的现象</h3>
        <p>{item.proposal_problem}</p>
      </div>
      <div className="wall-section">
        <h3>带来的影响</h3>
        <p>{item.proposal_impact}</p>
      </div>
      <div className="wall-section">
        <h3>建议方案</h3>
        <p>{item.proposal_suggestion}</p>
      </div>
    </div>
  );
}

function renderVentContent(item: PublicFeedback) {
  return (
    <div className="wall-content">
      <div className="wall-section">
        <h3>匿名反馈</h3>
        <p>{item.content_markdown}</p>
      </div>
    </div>
  );
}

export default function PublicWallPage() {
  const [items, setItems] = useState<PublicFeedback[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const response = await listPublicFeedbacks();
        if (!cancelled) {
          setItems(response.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "加载失败");
        }
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStar(publicCode: string) {
    const token = getStarToken();
    const response = await starPublicFeedback(publicCode, token);
    setItems((current) =>
      current.map((item) =>
        item.public_code === publicCode ? { ...item, star_count: response.star_count } : item,
      ),
    );
  }

  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "回音壁" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Public Echo Wall</p>
        <h1 className="section-title">回音壁</h1>
        <p className="hero-copy">只展示已被管理员公开的优质反馈与提案，让高频问题和被采纳动作被看见。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="wall-grid">
        {items.map((item) => {
          const adminReplies = item.admin_replies ?? [];

          return (
            <article className="entry-card" key={item.public_code}>
              <span className="entry-badge">{item.category}</span>
              <h2>{item.type === "proposal" ? "建设性提案" : "敏锐观察"}</h2>
              {item.title ? <p className="wall-title">{item.title}</p> : null}
              {item.type === "proposal" ? renderProposalSections(item) : renderVentContent(item)}
              {adminReplies.length > 0 ? (
                <div className="wall-replies">
                  <h3>管理员回复</h3>
                  {adminReplies.map((reply, index) => (
                    <div className="wall-reply" key={`${item.public_code}-${reply.created_at}-${index}`}>
                      <p>{reply.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="form-footer">
                <span className="helper-copy">{item.star_count} Stars</span>
                <button className="ghost-button" onClick={() => void handleStar(item.public_code)} type="button">
                  Star
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
