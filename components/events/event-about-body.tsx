import { NewsArticleHtml } from "@/components/news/news-article-html";
import { looksLikeRichHtml, sanitizeNewsHtml } from "@/lib/news-content";

function proseParagraphs(body: string | null, excerpt: string) {
  const raw = body?.trim() ? body.trim() : excerpt;
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type Props = {
  body: string | null;
  excerpt: string;
};

/** Rich or plain-text body for the event About section (used inside the collapsible client UI). */
export function EventAboutBody({ body, excerpt }: Props) {
  const bodyRaw = body?.trim() ?? "";
  const richHtml = looksLikeRichHtml(bodyRaw) ? sanitizeNewsHtml(bodyRaw) : "";

  if (richHtml) {
    return <NewsArticleHtml html={richHtml} className="mt-4 text-gcs-muted-text md:mt-5" />;
  }

  const paragraphs = proseParagraphs(body, excerpt);
  return (
    <div className="mt-4 space-y-5 md:mt-5">
      {paragraphs.map((block, i) => (
        <p key={i} className="text-[1.05rem] leading-[1.75] text-gcs-muted-text">
          {block}
        </p>
      ))}
    </div>
  );
}
