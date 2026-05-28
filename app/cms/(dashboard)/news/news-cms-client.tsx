"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, FileText, Newspaper, User } from "lucide-react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import { CmsButton, CmsCard, CmsFieldLabel, CmsInput } from "@/components/cms/cms-ui";
import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { CmsListActions } from "@/components/cms/cms-list-actions";
import { CmsPageHero, CmsSectionHeading } from "@/components/cms/cms-page-chrome";
import { CmsRichTextEditor } from "@/components/cms/cms-rich-text-editor";
import { handleCmsResponse } from "@/lib/cms-toast";
import { CmsDataTable } from "@/components/cms/cms-data-table";
import type { ColumnDef, ColumnSizingState } from "@tanstack/react-table";

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  authorName: string | null;
  authorRole: string | null;
  date: string;
  published: boolean;
  sortOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
  imageAlt: string;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtListDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const empty = {
  title: "",
  authorName: "",
  authorRole: "",
  body: "",
  date: toLocalInput(new Date().toISOString()),
  sortOrder: 0,
  published: false,
  imageUrl: "",
  imagePublicId: null as string | null,
  imageAlt: "",
};

function buildSavePayload(form: typeof empty) {
  const payload: Record<string, unknown> = {
    body: form.body,
    published: form.published,
    sortOrder: form.sortOrder,
  };
  if (form.title.trim()) payload.title = form.title.trim();
  if (form.authorName.trim()) payload.authorName = form.authorName.trim();
  if (form.authorRole.trim()) payload.authorRole = form.authorRole.trim();
  const when = new Date(form.date);
  if (!Number.isNaN(when.getTime())) payload.date = when.toISOString();
  if (form.imageUrl) {
    payload.imageUrl = form.imageUrl;
    payload.imagePublicId = form.imagePublicId;
    if (form.imageAlt.trim()) payload.imageAlt = form.imageAlt.trim();
  }
  return payload;
}

function PhaseBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gcs-primary/10 text-sm font-semibold text-gcs-primary">
        {n}
      </span>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
    </div>
  );
}

export function NewsCmsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/cms/news-items", cmsCredentials);
    if (!res.ok) {
      setErr(res.status === 401 ? CMS_UNAUTHORIZED_MESSAGE : await res.text());
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((await res.json()) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(row: Row) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      authorName: row.authorName ?? "",
      authorRole: row.authorRole ?? "",
      body: row.body ?? "",
      date: toLocalInput(row.date),
      published: row.published,
      sortOrder: row.sortOrder,
      imageUrl: row.imageUrl,
      imagePublicId: row.imagePublicId,
      imageAlt: row.imageAlt,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...empty, date: toLocalInput(new Date().toISOString()) });
  }

  function onTitleChange(title: string) {
    setForm((f) => {
      const next = { ...f, title };
      if (!f.imageAlt.trim() && title.trim()) {
        next.imageAlt = title;
      }
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload = buildSavePayload(form);

    const res = editingId
      ? await fetch(`/api/cms/news-items/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        })
      : await fetch("/api/cms/news-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        });
    if (await handleCmsResponse(res, editingId ? "Article updated" : "Article created", { setErr })) {
      resetForm();
      await load();
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/cms/news-items/${id}`, { method: "DELETE", ...cmsCredentials });
    if (await handleCmsResponse(res, "Article deleted", { setErr })) {
      if (editingId === id) resetForm();
      await load();
    }
  }

  async function patchRow(id: string, patch: Partial<Pick<Row, "published" | "sortOrder">>) {
    setErr(null);
    const res = await fetch(`/api/cms/news-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setErr(res.status === 401 ? CMS_UNAUTHORIZED_MESSAGE : await res.text());
      return false;
    }
    return true;
  }

  async function reorder(next: Row[]) {
    const normalized = next.map((r, i) => ({ ...r, sortOrder: i }));
    const changed = normalized.filter((r) => rows.find((x) => x.id === r.id)?.sortOrder !== r.sortOrder);
    setRows(normalized);
    if (changed.length === 0) return;

    const results = await Promise.all(changed.map((r) => patchRow(r.id, { sortOrder: r.sortOrder })));
    if (results.every(Boolean)) {
      await load();
    }
  }

  const columns: ColumnDef<Row>[] = [
    {
      id: "__drag",
      header: "",
      cell: () => null,
      size: 56,
      enableResizing: false,
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      size: 90,
      cell: ({ row, getValue }) => (
        <CmsInput
          type="number"
          className="w-24"
          defaultValue={Number(getValue())}
          onBlur={async (e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            const ok = await patchRow(row.original.id, { sortOrder: v });
            if (ok) {
              setRows((prev) => prev.map((x) => (x.id === row.original.id ? { ...x, sortOrder: v } : x)));
              await load();
            }
          }}
        />
      ),
    },
    {
      accessorKey: "published",
      header: "Published",
      size: 120,
      cell: ({ row }) => (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={row.original.published}
            onChange={async (e) => {
              const next = e.target.checked;
              setRows((prev) => prev.map((x) => (x.id === row.original.id ? { ...x, published: next } : x)));
              const ok = await patchRow(row.original.id, { published: next });
              if (!ok) await load();
            }}
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {row.original.published ? "Yes" : "No"}
          </span>
        </label>
      ),
    },
    {
      accessorKey: "title",
      header: "Headline",
      size: 360,
      cell: ({ row, getValue }) => (
        <button
          type="button"
          className="text-left font-semibold text-slate-900 hover:underline"
          onClick={() => startEdit(row.original)}
        >
          {String(getValue())}
        </button>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      size: 240,
      cell: ({ getValue }) => <span className="break-all text-xs text-slate-500">{String(getValue())}</span>,
    },
    {
      accessorKey: "date",
      header: "Date",
      size: 150,
      cell: ({ getValue }) => <span className="text-sm text-slate-700">{fmtListDate(String(getValue()))}</span>,
    },
    {
      id: "author",
      header: "Author",
      size: 200,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-sm text-slate-700">{row.original.authorName ?? "—"}</p>
          <p className="text-xs text-slate-500">{row.original.authorRole ?? ""}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 200,
      cell: ({ row }) => (
        <CmsListActions
          onEdit={() => startEdit(row.original)}
          onDelete={() => remove(row.original.id)}
          confirm={{
            title: "Delete this news article?",
            description: (
              <>
                The article{" "}
                <span className="font-semibold text-slate-900">&ldquo;{row.original.title}&rdquo;</span> ({row.original.slug})
                will be removed from the public news feed immediately.
              </>
            ),
            highlights: (
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>This action cannot be undone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>Any external links pointing to this article will break.</span>
                </li>
              </ul>
            ),
            confirmLabel: "Delete article",
          }}
        />
      ),
    },
  ];

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <CmsPageHero
        eyebrow="Public site"
        title="News"
        description="Build each article in three steps. Only the headline is needed to save a draft — cover image, author, date, and body are all optional. The public URL is created automatically from the title."
        icon={Newspaper}
        action={
          editingId ? (
            <CmsButton type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </CmsButton>
          ) : null
        }
      />

      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}

      <CmsCard className="p-8">
        <form className="space-y-10" onSubmit={save}>
          <section className="space-y-5">
            <PhaseBadge n={1} label="Title & author" />
            <label>
              <CmsFieldLabel>Headline</CmsFieldLabel>
              <CmsInput
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="e.g. National chemistry summit opens in Accra"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <CmsFieldLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    Author name <span className="font-normal text-slate-400">(optional)</span>
                  </span>
                </CmsFieldLabel>
                <CmsInput
                  value={form.authorName}
                  onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                  placeholder="e.g. Dr. Ama Mensah"
                />
              </label>
              <label>
                <CmsFieldLabel>
                  Author role / affiliation <span className="font-normal text-slate-400">(optional)</span>
                </CmsFieldLabel>
                <CmsInput
                  value={form.authorRole}
                  onChange={(e) => setForm((f) => ({ ...f, authorRole: e.target.value }))}
                  placeholder="e.g. Communications, Ghana Chemical Society"
                />
              </label>
            </div>
            <label>
              <CmsFieldLabel>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                  Publication date <span className="font-normal text-slate-400">(optional)</span>
                </span>
              </CmsFieldLabel>
              <CmsInput
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Leave as today or pick an earlier date for archive articles.
              </p>
            </label>
            <div className="flex flex-wrap items-center gap-6">
              <label>
                <CmsFieldLabel>Sort order</CmsFieldLabel>
                <CmsInput
                  type="number"
                  className="w-28"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                Published on the public site
              </label>
            </div>
          </section>

          <section className="space-y-5">
            <PhaseBadge n={2} label="Cover image" />
            <CmsImageUpload
              label="Hero image (optional)"
              folder="news"
              previewUrl={form.imageUrl || null}
              onChange={(url, publicId) => setForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
              onClear={() => setForm((f) => ({ ...f, imageUrl: "", imagePublicId: null }))}
              helperText="Shown at the top of the article and in the news listing."
            />
            <label>
              <CmsFieldLabel>Image description (accessibility)</CmsFieldLabel>
              <CmsInput
                value={form.imageAlt}
                onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))}
                placeholder="Describe the photo for screen readers"
              />
            </label>
          </section>

          <section className="space-y-5">
            <PhaseBadge n={3} label="Full article" />
            <CmsRichTextEditor
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              label="Story"
              placeholder="Write the full article. Use bold, italic, headings, lists, quotes, links, and inline images."
            />
            <p className="text-xs text-slate-500">
              A short summary for the news listing is created automatically from the first part of your article.
            </p>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <CmsButton type="submit">{editingId ? "Save changes" : "Save article"}</CmsButton>
            {editingId ? (
              <CmsButton type="button" variant="ghost" onClick={resetForm}>
                Discard changes
              </CmsButton>
            ) : null}
          </div>
        </form>
      </CmsCard>

      <div>
        <CmsSectionHeading
          title="All articles"
          description="Edit or remove items. Drafts stay hidden until published."
          icon={FileText}
        />
        <div className="mt-6">
          <CmsDataTable
            rows={rows}
            columns={columns}
            onReorder={reorder}
            emptyLabel="No articles yet."
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
          />
        </div>
      </div>
    </div>
  );
}
