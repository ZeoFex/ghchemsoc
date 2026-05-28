"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import { CmsButton, CmsCard, CmsFieldLabel, CmsInput, CmsTextarea } from "@/components/cms/cms-ui";
import { CmsRichTextEditor } from "@/components/cms/cms-rich-text-editor";
import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { CmsListActions } from "@/components/cms/cms-list-actions";
import { CmsSectionTitle } from "@/components/cms/cms-section-title";
import { parseRegistrationFormFields } from "@/lib/event-registration-form";
import type { Prisma } from "@prisma/client";
import type { RegistrationFieldDef } from "@/lib/event-registration-form";
import { createEmptyRegistrationField } from "@/lib/event-registration-form";
import { handleCmsResponse } from "@/lib/cms-toast";
import { isNewsBodyEmpty } from "@/lib/news-content";
import { HomepageEventsSpotlightCms } from "@/components/cms/homepage-events-spotlight-cms";
import { CmsDataTable } from "@/components/cms/cms-data-table";
import type { ColumnDef, ColumnSizingState } from "@tanstack/react-table";

type Row = {
  id: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  title: string;
  excerpt: string;
  body: string | null;
  startDate: string;
  endDate: string | null;
  timeLabel: string;
  location: string;
  href: string | null;
  badge: string | null;
  imageUrl: string;
  imagePublicId: string | null;
  imageAlt: string;
  registrationFormFields?: unknown;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function cleanRegistrationFormFieldsForCreate(fields: RegistrationFieldDef[]): RegistrationFieldDef[] {
  return fields
    .map((f) => ({
      ...f,
      id: f.id.trim() || `field_${Math.random().toString(36).slice(2, 9)}`,
      label: f.label.trim(),
      options: f.type === "select" ? (f.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
    }))
    .filter((f) => f.label.length > 0);
}

function getEmptyForm() {
  return {
    title: "",
    excerpt: "",
    body: "",
    startDate: toLocalInput(new Date().toISOString()),
    endDate: "" as string,
    timeLabel: "",
    location: "",
    badge: "",
    featured: false,
    published: true,
    sortOrder: 0,
    imageUrl: "",
    imagePublicId: null as string | null,
    imageAlt: "",
    registrationFormFields: [] as RegistrationFieldDef[],
  };
}

export function EventsCmsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState(getEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [registrationFormExpanded, setRegistrationFormExpanded] = useState(false);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/cms/society-events", cmsCredentials);
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
      excerpt: row.excerpt,
      body: row.body ?? "",
      startDate: toLocalInput(row.startDate),
      endDate: row.endDate ? toLocalInput(row.endDate) : "",
      timeLabel: row.timeLabel,
      location: row.location,
      badge: row.badge ?? "",
      featured: row.featured,
      published: row.published,
      sortOrder: row.sortOrder,
      imageUrl: row.imageUrl,
      imagePublicId: row.imagePublicId,
      imageAlt: row.imageAlt,
      registrationFormFields: parseRegistrationFormFields(row.registrationFormFields as Prisma.JsonValue),
    });
    setRegistrationFormExpanded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetEventForm() {
    setEditingId(null);
    setForm(getEmptyForm());
    setRegistrationFormExpanded(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.imageUrl) {
      setErr("Upload an event image — pasted URLs are not supported here.");
      return;
    }
    const cleanedFields = cleanRegistrationFormFieldsForCreate(form.registrationFormFields);
    for (const f of cleanedFields) {
      if (f.type === "select" && !(f.options?.length)) {
        setErr('Select fields need at least one option (use "Registration form" below).');
        return;
      }
    }
    const payload: Record<string, unknown> = {
      title: form.title,
      excerpt: form.excerpt,
      body: !isNewsBodyEmpty(form.body) ? form.body : null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      timeLabel: form.timeLabel,
      location: form.location,
      badge: form.badge || null,
      featured: form.featured,
      published: form.published,
      sortOrder: form.sortOrder,
      imageUrl: form.imageUrl,
      imagePublicId: form.imagePublicId,
      imageAlt: form.imageAlt || form.title,
    };
    if (!editingId && cleanedFields.length) payload.registrationFormFields = cleanedFields;

    const res = editingId
      ? await fetch(`/api/cms/society-events/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        })
      : await fetch("/api/cms/society-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        });
    const msg = editingId ? "Event updated" : "Event created";
    if (await handleCmsResponse(res, msg, { setErr })) {
      resetEventForm();
      await load();
    }
  }

  function toggleRegistrationFormPanel() {
    setRegistrationFormExpanded((wasOpen) => {
      const next = !wasOpen;
      if (next) {
        setForm((f) =>
          f.registrationFormFields.length === 0 ? { ...f, registrationFormFields: [createEmptyRegistrationField()] } : f
        );
      }
      return next;
    });
  }

  async function remove(id: string) {
    const res = await fetch(`/api/cms/society-events/${id}`, { method: "DELETE", ...cmsCredentials });
    if (await handleCmsResponse(res, "Event deleted", { setErr })) {
      if (editingId === id) resetEventForm();
      await load();
    }
  }

  async function patchRow(id: string, patch: Partial<Pick<Row, "published" | "featured" | "sortOrder" | "title">>) {
    setErr(null);
    const res = await fetch(`/api/cms/society-events/${id}`, {
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
    // Normalize sort order after drag-and-drop.
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
      header: "Live",
      size: 86,
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
      accessorKey: "featured",
      header: "Featured",
      size: 110,
      cell: ({ row }) => (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={row.original.featured}
            onChange={async (e) => {
              const next = e.target.checked;
              setRows((prev) => prev.map((x) => (x.id === row.original.id ? { ...x, featured: next } : x)));
              const ok = await patchRow(row.original.id, { featured: next });
              if (!ok) await load();
            }}
          />
        </label>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
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
      id: "whenWhere",
      header: "When & where",
      size: 320,
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm text-slate-700">{new Date(row.original.startDate).toLocaleString()}</p>
          <p className="text-xs text-slate-500">{row.original.location}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 260,
      enableResizing: true,
      cell: ({ row }) => (
        <CmsListActions
          onEdit={() => startEdit(row.original)}
          onDelete={() => remove(row.original.id)}
          confirm={{
            title: "Delete this event?",
            description: (
              <>
                <span className="font-semibold text-slate-900">&ldquo;{row.original.title}&rdquo;</span>{" "}
                will be removed from the public events page along with its registration form.
              </>
            ),
            highlights: (
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>All registrations attached to this event will be permanently removed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>This action cannot be undone.</span>
                </li>
              </ul>
            ),
            confirmLabel: "Delete event",
          }}
        >
          <Link
            href={`/cms/events/${row.original.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-gcs-border bg-white px-4 py-2.5 text-sm font-semibold text-gcs-foreground transition-colors hover:bg-neutral-50"
          >
            Form &amp; registrations
          </Link>
        </CmsListActions>
      ),
    },
  ];

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">Public site</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Events</h1>
        <p className="mt-2 text-sm text-slate-600">
          Conferences and meetings listed on the public Events page. Use the homepage spotlight below for image and text side by side; mark one event as featured for the large card on the events page.
        </p>
      </div>
      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}

      <HomepageEventsSpotlightCms />

      <CmsCard className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CmsSectionTitle>{editingId ? "Edit event" : "Add event"}</CmsSectionTitle>
          {editingId ? (
            <CmsButton type="button" variant="ghost" onClick={resetEventForm}>
              Cancel edit
            </CmsButton>
          ) : null}
        </div>
        {editingId ? (
          <p className="mt-2 text-sm text-slate-600">
            Registration form fields are managed on the{" "}
            <Link href={`/cms/events/${editingId}`} className="font-semibold text-gcs-primary hover:underline">
              Form &amp; registrations
            </Link>{" "}
            page.
          </p>
        ) : null}
        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={save}>
          <div className="md:col-span-2">
            <CmsImageUpload
              label="Event image"
              folder="events"
              required
              previewUrl={form.imageUrl || null}
              onChange={(url, publicId) => setForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
              onClear={() => setForm((f) => ({ ...f, imageUrl: "", imagePublicId: null }))}
            />
          </div>
          <label className="md:col-span-2">
            <CmsFieldLabel>Image alt</CmsFieldLabel>
            <CmsInput value={form.imageAlt} onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))} />
          </label>
          <label className="md:col-span-2">
            <CmsFieldLabel>Title</CmsFieldLabel>
            <CmsInput required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="md:col-span-2">
            <CmsFieldLabel>Excerpt</CmsFieldLabel>
            <CmsTextarea required rows={3} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
          </label>
          <div className="md:col-span-2">
            <CmsRichTextEditor
              label="Detail page body (optional)"
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              imageFolder="events/body"
              minHeight="320px"
              placeholder="Full description for the public event page — headings, lists, tables, and inline images."
            />
          </div>
          <label>
            <CmsFieldLabel>Start</CmsFieldLabel>
            <CmsInput type="datetime-local" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>End (optional)</CmsFieldLabel>
            <CmsInput type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Time label (display)</CmsFieldLabel>
            <CmsInput required placeholder="09:00 – 17:00 GMT" value={form.timeLabel} onChange={(e) => setForm((f) => ({ ...f, timeLabel: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Location</CmsFieldLabel>
            <CmsInput required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Badge (optional)</CmsFieldLabel>
            <CmsInput placeholder="Flagship" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Sort order</CmsFieldLabel>
            <CmsInput type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
            Featured (large card on the Events page when set)
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <CmsButton type="submit">{editingId ? "Save changes" : "Create event"}</CmsButton>
            {!editingId ? (
              <CmsButton type="button" variant="ghost" onClick={toggleRegistrationFormPanel}>
                {registrationFormExpanded ? "Hide registration form" : "Registration form"}
              </CmsButton>
            ) : null}
          </div>
          {!editingId && registrationFormExpanded ? (
            <div className="md:col-span-2 rounded-2xl border border-gcs-border/70 bg-neutral-50/80 p-5 md:p-6">
              <p className="text-sm font-semibold text-slate-900">Registration form fields</p>
              <p className="mt-1 text-sm text-slate-600">
                These are saved with the event when you click <span className="font-medium text-slate-800">Create event</span>. Visitors use{" "}
                <span className="font-medium text-slate-800">Register here</span> on the public listing and event page.
              </p>
              <ul className="mt-5 space-y-4">
                {form.registrationFormFields.map((f, i) => (
                  <li key={`${f.id}-${i}`} className="rounded-xl border border-gcs-border/70 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        <CmsFieldLabel>Field id</CmsFieldLabel>
                        <CmsInput
                          value={f.id}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              registrationFormFields: prev.registrationFormFields.map((x, j) =>
                                j === i ? { ...x, id: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        <CmsFieldLabel>Label</CmsFieldLabel>
                        <CmsInput
                          value={f.label}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              registrationFormFields: prev.registrationFormFields.map((x, j) =>
                                j === i ? { ...x, label: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        <CmsFieldLabel>Type</CmsFieldLabel>
                        <select
                          className="mt-1 w-full rounded-xl border border-gcs-border bg-white px-3 py-2 text-sm"
                          value={f.type}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              registrationFormFields: prev.registrationFormFields.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      type: e.target.value as RegistrationFieldDef["type"],
                                      options:
                                        e.target.value === "select"
                                          ? x.options?.length
                                            ? x.options
                                            : ["Student", "Professional"]
                                          : undefined,
                                    }
                                  : x
                              ),
                            }))
                          }
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="textarea">Long text</option>
                          <option value="select">Select</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={Boolean(f.required)}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              registrationFormFields: prev.registrationFormFields.map((x, j) =>
                                j === i ? { ...x, required: e.target.checked } : x
                              ),
                            }))
                          }
                        />
                        Required
                      </label>
                      {f.type === "select" ? (
                        <label className="md:col-span-2">
                          <CmsFieldLabel>Options (one per line)</CmsFieldLabel>
                          <textarea
                            className="mt-1 w-full rounded-xl border border-gcs-border bg-white px-3 py-2 text-sm"
                            rows={4}
                            value={(f.options ?? []).join("\n")}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                registrationFormFields: prev.registrationFormFields.map((x, j) =>
                                  j === i
                                    ? { ...x, options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }
                                    : x
                                ),
                              }))
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-sm font-medium text-red-700 hover:underline"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            registrationFormFields: prev.registrationFormFields.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove field
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <CmsButton type="button" variant="ghost" onClick={() => setForm((f) => ({ ...f, registrationFormFields: [...f.registrationFormFields, createEmptyRegistrationField()] }))}>
                  Add field
                </CmsButton>
              </div>
            </div>
          ) : null}
        </form>
      </CmsCard>

      <div>
        <CmsSectionTitle>Scheduled events</CmsSectionTitle>
        <div className="mt-6">
          <CmsDataTable
            rows={rows}
            columns={columns}
            onReorder={reorder}
            emptyLabel="No events yet."
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
          />
        </div>
      </div>
    </div>
  );
}
