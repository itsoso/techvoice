import type { ReactNode } from "react";

import SiteChrome from "../components/SiteChrome";
import retrospectiveSource from "../../../docs/retrospectives/2026-03-13-techvoice-build-retrospective.md?raw";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;
const ORDERED_LIST_PATTERN = /^\d+\.\s+(.*)$/;
const BULLET_LIST_PATTERN = /^-\s+(.*)$/;
const NUMBERED_HEADING_PATTERN = /^\d+(?:\.\d+)*\.?\s+/;
const INLINE_PATTERN = /(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

function cleanLine(line: string) {
  return line.replace(/\s+$/, "");
}

function normalizeHeading(text: string) {
  return text.replace(NUMBERED_HEADING_PATTERN, "").trim();
}

function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];

  for (let index = 0; index < lines.length; ) {
    const rawLine = cleanLine(lines[index]);
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    const orderedMatch = line.match(ORDERED_LIST_PATTERN);
    if (orderedMatch) {
      const items: string[] = [];

      while (index < lines.length) {
        const nextLine = cleanLine(lines[index]).trim();
        const match = nextLine.match(ORDERED_LIST_PATTERN);

        if (!match) {
          break;
        }

        items.push(match[1].trim());
        index += 1;
      }

      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    const bulletMatch = line.match(BULLET_LIST_PATTERN);
    if (bulletMatch) {
      const items: string[] = [];

      while (index < lines.length) {
        const nextLine = cleanLine(lines[index]).trim();
        const match = nextLine.match(BULLET_LIST_PATTERN);

        if (!match) {
          break;
        }

        items.push(match[1].trim());
        index += 1;
      }

      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const nextLine = cleanLine(lines[index]);
      const trimmedLine = nextLine.trim();

      if (
        !trimmedLine ||
        HEADING_PATTERN.test(trimmedLine) ||
        ORDERED_LIST_PATTERN.test(trimmedLine) ||
        BULLET_LIST_PATTERN.test(trimmedLine)
      ) {
        break;
      }

      paragraphLines.push(trimmedLine);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

function renderInlineText(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const [fullMatch] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }

    if (match[2]) {
      nodes.push(
        <code className="inline-code" key={`${keyPrefix}-${matchIndex}`}>
          {match[2]}
        </code>,
      );
    } else if (match[4] && match[5]) {
      nodes.push(
        <a
          className="retrospective-link"
          href={match[5]}
          key={`${keyPrefix}-${matchIndex}`}
          rel="noreferrer"
          target="_blank"
        >
          {match[4]}
        </a>,
      );
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

const RETROSPECTIVE_BLOCKS = parseMarkdown(retrospectiveSource);
const TITLE_BLOCK = RETROSPECTIVE_BLOCKS.find((block) => block.type === "heading" && block.level === 1);
const PAGE_TITLE =
  TITLE_BLOCK && TITLE_BLOCK.type === "heading"
    ? normalizeHeading(TITLE_BLOCK.text)
    : "TechVoice 系统构建完整复盘";
const CONTENT_BLOCKS = RETROSPECTIVE_BLOCKS.slice(TITLE_BLOCK ? 1 : 0);

export default function RetrospectivePage() {
  return (
    <main className="page-shell">
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "系统架构", to: "/architecture" },
          { label: "项目复盘" },
        ]}
      />

      <section className="hero-panel">
        <p className="mono-kicker">Build retrospective and delivery notes</p>
        <h1 className="section-title">{PAGE_TITLE}</h1>
        <p className="hero-copy">
          这份复盘记录了 TechVoice 从 PRD 输入、MVP 构建、双仓库托管、线上部署到后续修复迭代的完整过程。
        </p>
      </section>

      <section aria-label="系统构建复盘正文" className="retrospective-panel">
        <article className="retrospective-content">
          {CONTENT_BLOCKS.map((block, index) => {
            if (block.type === "heading") {
              const headingText = normalizeHeading(block.text);

              if (block.level === 2) {
                return (
                  <h2 className="retrospective-heading" key={`heading-${index}`}>
                    {headingText}
                  </h2>
                );
              }

              return (
                <h3 className="retrospective-subheading" key={`heading-${index}`}>
                  {headingText}
                </h3>
              );
            }

            if (block.type === "list") {
              const ListTag = block.ordered ? "ol" : "ul";

              return (
                <ListTag
                  className={block.ordered ? "retrospective-list retrospective-list-ordered" : "retrospective-list"}
                  key={`list-${index}`}
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={`item-${index}-${itemIndex}`}>{renderInlineText(item, `list-${index}-${itemIndex}`)}</li>
                  ))}
                </ListTag>
              );
            }

            return (
              <p className="retrospective-paragraph" key={`paragraph-${index}`}>
                {renderInlineText(block.text, `paragraph-${index}`)}
              </p>
            );
          })}
        </article>
      </section>
    </main>
  );
}
