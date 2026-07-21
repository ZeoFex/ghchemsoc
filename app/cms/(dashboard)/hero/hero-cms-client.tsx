"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import { CmsButton, CmsCard, CmsFieldLabel, CmsInput, CmsTextarea } from "@/components/cms/cms-ui";
import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { CmsListActions } from "@/components/cms/cms-list-actions";
import { CmsSectionTitle } from "@/components/cms/cms-section-title";
import { handleCmsResponse } from "@/lib/cms-toast";

type Slide = {
  id: string;
  sortOrder: number;
  published: boolean;
  imagePublicId: string | null;
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  headlineLine1: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

const emptyForm = {
  imageUrl: "",
  imagePublicId: "" as string | null,
  imageAlt: "",
  eyebrow: "",
  headlineLine1: "",
  description: "",
  ctaLabel: "",
  ctaHref: "",
  sortOrder: 0,
  published: true,
};

export function HeroCmsClient() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  function slideToForm(s: Slide & { headlineLine2?: string }) {
    return {
      imageUrl: s.imageUrl,
      imagePublicId: s.imagePublicId,
      imageAlt: s.imageAlt,
      eyebrow: s.eyebrow,
      headlineLine1: s.headlineLine1,
      description: s.description,
      ctaLabel: s.ctaLabel,
      ctaHref: s.ctaHref,
      sortOrder: s.sortOrder,
      published: s.published,
    };
  }

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/cms/hero-slides?admin=1", cmsCredentials);
    if (!res.ok) {
      setErr(res.status === 401 ? CMS_UNAUTHORIZED_MESSAGE : await res.text());
      setSlides([]);
      setLoading(false);
      return;
    }
    const raw = (await res.json()) as (Slide & { headlineLine2?: string })[];
    setSlides(
      raw.map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
        published: s.published,
        imagePublicId: s.imagePublicId,
        imageUrl: s.imageUrl,
        imageAlt: s.imageAlt,
        eyebrow: s.eyebrow,
        headlineLine1: s.headlineLine1,
        description: s.description,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(s: Slide) {
    setEditingId(s.id);
    setForm(slideToForm(s));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveSlide(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.imageUrl) {
      setErr("Please upload a slide image (drag & drop or file picker).");
      return;
    }
    const payload = {
      imageUrl: form.imageUrl,
      imagePublicId: form.imagePublicId || null,
      imageAlt: form.imageAlt,
      eyebrow: form.eyebrow,
      headlineLine1: form.headlineLine1,
      headlineLine2: "",
      description: form.description,
      tags: [] as string[],
      highlights: [] as string[],
      ctaLabel: form.ctaLabel,
      ctaHref: form.ctaHref,
      secondaryLabel: null,
      secondaryHref: null,
      statValue: null,
      statLabel: null,
      sortOrder: form.sortOrder,
      published: form.published,
    };
    const res = editingId
      ? await fetch(`/api/cms/hero-slides/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        })
      : await fetch("/api/cms/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          ...cmsCredentials,
          body: JSON.stringify(payload),
        });
    if (!(await handleCmsResponse(res, editingId ? "Slide updated" : "Hero slide saved", { setErr }))) return;
    resetForm();
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/cms/hero-slides/${id}`, { method: "DELETE", ...cmsCredentials });
    if (await handleCmsResponse(res, "Slide deleted", { setErr, failureTitle: "Delete failed" })) {
      if (editingId === id) resetForm();
      await load();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Loading hero…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">Homepage</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Hero carousel</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Each slide needs an image and description. Eyebrow, headline, alt text, and button are optional. Only filled
          fields appear on the homepage carousel.
        </p>
      </div>

      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">{err}</p> : null}

      <CmsCard className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CmsSectionTitle description="Upload cover art and the copy that visitors actually see.">
            {editingId ? "Edit slide" : "New slide"}
          </CmsSectionTitle>
          {editingId ? (
            <CmsButton type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </CmsButton>
          ) : null}
        </div>
        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={saveSlide}>
          <div className="md:col-span-2">
            <CmsImageUpload
              label="Slide image"
              folder="hero"
              required
              previewUrl={form.imageUrl || null}
              onChange={(url, publicId) => setForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
              onClear={() => setForm((f) => ({ ...f, imageUrl: "", imagePublicId: null }))}
              helperText="PNG or JPG · at least 1600px wide"
            />
          </div>
          <label>
            <CmsFieldLabel>Image alt text (optional)</CmsFieldLabel>
            <CmsInput value={form.imageAlt} onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Eyebrow (optional)</CmsFieldLabel>
            <CmsInput
              value={form.eyebrow}
              onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
              placeholder="Small label above headline"
            />
          </label>
          <label className="md:col-span-2">
            <CmsFieldLabel>Headline (optional)</CmsFieldLabel>
            <CmsInput
              value={form.headlineLine1}
              onChange={(e) => setForm((f) => ({ ...f, headlineLine1: e.target.value }))}
            />
          </label>
          <label className="md:col-span-2">
            <CmsFieldLabel>Description</CmsFieldLabel>
            <CmsTextarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label>
            <CmsFieldLabel>Button label (optional)</CmsFieldLabel>
            <CmsInput value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Button link (optional)</CmsFieldLabel>
            <CmsInput value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} />
          </label>
          <label>
            <CmsFieldLabel>Sort order</CmsFieldLabel>
            <CmsInput type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700 md:col-span-2">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published on site
          </label>
          <div className="md:col-span-2">
            <CmsButton type="submit" className="min-w-[160px]">
              {editingId ? "Save changes" : "Create slide"}
            </CmsButton>
          </div>
        </form>
      </CmsCard>

      <div>
        <CmsSectionTitle description="Lower numbers appear first in the carousel.">
          Published slides
        </CmsSectionTitle>
        {slides.length === 0 ? <p className="mt-4 text-sm text-slate-500">No slides yet.</p> : null}
        <ul className="mt-6 space-y-4">
          {slides.map((s) => (
            <li key={s.id}>
              <CmsCard className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl md:h-28 md:w-44">
                  <Image src={s.imageUrl} alt={s.imageAlt || s.headlineLine1 || "Hero slide"} fill className="object-cover" sizes="200px" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-slate-900">{s.headlineLine1 || s.eyebrow || "Untitled slide"}</p>
                  {s.eyebrow && s.headlineLine1 ? <p className="text-slate-600">{s.eyebrow}</p> : null}
                  <p className="mt-1 line-clamp-2 text-slate-500">{s.description}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Order {s.sortOrder} · {s.published ? "Live" : "Draft"}
                    {s.ctaLabel ? ` · ${s.ctaLabel}` : ""}
                  </p>
                </div>
                <CmsListActions
                  onEdit={() => startEdit(s)}
                  onDelete={() => remove(s.id)}
                  confirm={{
                    title: "Delete this hero slide?",
                    description: (
                      <>
                        The slide{" "}
                        <span className="font-semibold text-slate-900">
                          &ldquo;{s.headlineLine1 || s.eyebrow || "Untitled"}&rdquo;
                        </span>{" "}
                        will be removed from the homepage carousel.
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
                          <span>Tip: uncheck <em>Published</em> to hide without deleting.</span>
                        </li>
                      </ul>
                    ),
                    confirmLabel: "Delete slide",
                  }}
                />
              </CmsCard>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
