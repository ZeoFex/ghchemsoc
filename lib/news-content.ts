import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Builds a valid slug from an optional custom value and/or title. */
export function resolveNewsSlugBase(preferred: string | null | undefined, title: string): string {
  const fromPreferred = preferred?.trim().toLowerCase() ?? "";
  if (fromPreferred && SLUG_REGEX.test(fromPreferred)) return fromPreferred.slice(0, 120);
  const fromTitle = slugFromTitle(title);
  if (fromTitle && SLUG_REGEX.test(fromTitle)) return fromTitle;
  return `article-${Date.now()}`;
}

export function isValidNewsSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function excerptFromHtml(html: string | null | undefined, maxLen = 220): string {
  if (!html?.trim()) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    "*": ["class", "style"],
    a: ["href", "target", "rel", "class", "style"],
    img: ["src", "alt", "class", "style"],
    th: ["colspan", "rowspan", "class", "style"],
    td: ["colspan", "rowspan", "class", "style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
};

export function sanitizeNewsHtml(html: string | null | undefined): string {
  if (!html?.trim()) return "";
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export function isNewsBodyEmpty(html: string | null | undefined): boolean {
  const clean = sanitizeNewsHtml(html);
  if (!clean) return true;
  const text = clean.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
  return text.length === 0;
}

/** True when stored body is HTML from the rich text editor (vs legacy plain text). */
export function looksLikeRichHtml(body: string | null | undefined): boolean {
  const raw = body?.trim() ?? "";
  if (!raw) return false;
  return /<[a-z][\s\S]*>/i.test(raw);
}
