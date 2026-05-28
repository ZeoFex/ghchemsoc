"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import { CmsButton, CmsCard, CmsFieldLabel, CmsInput, CmsTextarea } from "@/components/cms/cms-ui";
import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { CmsListActions } from "@/components/cms/cms-list-actions";
import { CmsSectionTitle } from "@/components/cms/cms-section-title";
import { CmsDataTable } from "@/components/cms/cms-data-table";
import type { ColumnDef, ColumnSizingState } from "@tanstack/react-table";
import { handleCmsResponse } from "@/lib/cms-toast";

type Row = {
  id: string;
  sortOrder: number;
  published: boolean;
  name: string;
  role: string;
  quote: string;
  imageUrl: string;
  imagePublicId: string | null;
  imageAlt: string;
};

const empty = {
  name: "",
  role: "",
  quote: "",
  imageUrl: "",
  imagePublicId: null as string | null,
  imageAlt: "",
  sortOrder: 0,
  published: true,
};

export function TestimonialsCmsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/cms/testimonials", cmsCredentials);
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
      name: row.name,
      role: row.role,
      quote: row.quote,
      imageUrl: row.imageUrl,
      imagePublicId: row.imagePublicId,
      imageAlt: row.imageAlt,
      sortOrder: row.sortOrder,
      published: row.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(empty);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload = {
      name: form.name,
      role: form.role,
      quote: form.quote,
      imageUrl: form.imageUrl || undefined,
      imagePublicId: form.imagePublicId,
      imageAlt: form.imageAlt || form.name,
      sortOrder: form.sortOrder,
      published: form.published,
    };
    const res = editingId
      ? await fetch(`/api/cms/testimonials/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        })
      : await fetch("/api/cms/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        });
    const msg = editingId ? "Testimonial updated" : "Testimonial added";
    if (await handleCmsResponse(res, msg, { setErr })) {
      resetForm();
      await load();
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/cms/testimonials/${id}`, { method: "DELETE", ...cmsCredentials });
    if (await handleCmsResponse(res, "Testimonial removed", { setErr })) {
      if (editingId === id) resetForm();
      await load();
    }
  }

  async function patchRow(id: string, patch: Partial<Pick<Row, "published" | "sortOrder">>) {
    setErr(null);
    const res = await fetch(`/api/cms/testimonials/${id}`, {
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
    if (results.every(Boolean)) await load();
  }

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "__drag", header: "", cell: () => null, size: 56, enableResizing: false },
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
        header: "Live",
        size: 90,
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
          </label>
        ),
      },
      {
        id: "person",
        header: "Person",
        size: 360,
        cell: ({ row }) => (
          <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => startEdit(row.original)}>
            {row.original.imageUrl ? (
              <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <Image src={row.original.imageUrl} alt={row.original.imageAlt || row.original.name} fill className="object-cover" sizes="40px" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500">
                {row.original.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-900 hover:underline">{row.original.name}</span>
              <span className="block truncate text-xs text-slate-500">{row.original.role}</span>
            </span>
          </button>
        ),
      },
      {
        accessorKey: "quote",
        header: "Quote",
        size: 520,
        cell: ({ getValue }) => <p className="line-clamp-2 text-sm text-slate-700">{String(getValue())}</p>,
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
              title: "Remove this testimonial?",
              description: (
                <>
                  <span className="font-semibold text-slate-900">{row.original.name}</span> will be removed from the public site.
                </>
              ),
              confirmLabel: "Remove",
            }}
          />
        ),
      },
    ],
    [load, rows]
  );

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">Homepage</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Testimonials</h1>
        <p className="mt-2 text-sm text-slate-600">Quotes shown in the rotating “Member voices” section on the homepage.</p>
      </div>

      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}

      <CmsCard className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CmsSectionTitle description="Add one quote at a time. Photos are optional.">
            {editingId ? "Edit testimonial" : "Add testimonial"}
          </CmsSectionTitle>
          {editingId ? (
            <CmsButton type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </CmsButton>
          ) : null}
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={save}>
          <div className="md:col-span-2">
            <CmsImageUpload
              label="Portrait (optional)"
              folder="testimonials"
              previewUrl={form.imageUrl || null}
              onChange={(url, publicId) => setForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
              onClear={() => setForm((f) => ({ ...f, imageUrl: "", imagePublicId: null }))}
            />
          </div>
          <label className="md:col-span-2">
            <CmsFieldLabel>Image alt</CmsFieldLabel>
            <CmsInput value={form.imageAlt} onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Name</CmsFieldLabel>
            <CmsInput required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Role / affiliation</CmsFieldLabel>
            <CmsInput required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          </label>
          <label className="md:col-span-2">
            <CmsFieldLabel>Quote</CmsFieldLabel>
            <CmsTextarea required rows={5} value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Sort order</CmsFieldLabel>
            <CmsInput type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published
          </label>
          <div className="md:col-span-2">
            <CmsButton type="submit">{editingId ? "Save changes" : "Add testimonial"}</CmsButton>
          </div>
        </form>
      </CmsCard>

      <div>
        <CmsSectionTitle>All testimonials</CmsSectionTitle>
        <div className="mt-6">
          <CmsDataTable
            rows={rows}
            columns={columns}
            onReorder={reorder}
            emptyLabel="No testimonials yet."
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
          />
        </div>
      </div>
    </div>
  );
}

