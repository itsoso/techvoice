import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listPublicFeedbacks, starPublicFeedback, type PublicFeedback } from "../api/feedbacks";

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
      <section className="hero-panel">
        <p className="mono-kicker">Public Echo Wall</p>
        <h1>回音壁</h1>
        <p className="hero-copy">只展示已被管理员公开的优质反馈与提案，让高频问题和被采纳动作被看见。</p>
        <div className="hero-footer">
          <Link className="ghost-link" to="/">
            返回首页
          </Link>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="wall-grid">
        {items.map((item) => (
          <article className="entry-card" key={item.public_code}>
            <span className="entry-badge">{item.category}</span>
            <h2>{item.type === "proposal" ? "建设性提案" : "敏锐观察"}</h2>
            <p>{item.content_markdown ?? item.proposal_suggestion ?? item.proposal_problem}</p>
            <div className="form-footer">
              <span className="helper-copy">{item.star_count} Stars</span>
              <button className="ghost-button" onClick={() => void handleStar(item.public_code)} type="button">
                Star
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
