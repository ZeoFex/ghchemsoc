"use client";

import { useCallback, useEffect, useState } from "react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import { CmsButton, CmsCard } from "@/components/cms/cms-ui";
import { CmsSectionTitle } from "@/components/cms/cms-section-title";
import { ChevronDown, ChevronUp } from "lucide-react";
import { handleCmsResponse } from "@/lib/cms-toast";
import { refreshCmsNotifications } from "@/components/cms/cms-nav-badges";

type Row = {
  id: string;
  createdAt: string;
  read: boolean;
  status: "pending" | "approved" | "rejected";
  summaryLine: string;
  lines: { label: string; value: string }[];
};

export function TestimonialInboxClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setErr(null);
    const q = unreadOnly ? "?unread=1&status=pending" : "?status=pending";
    const res = await fetch(`/api/cms/testimonial-inbox${q}`, cmsCredentials);
    if (!res.ok) {
      setErr(res.status === 401 ? CMS_UNAUTHORIZED_MESSAGE : await res.text());
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((await res.json()) as Row[]);
    setLoading(false);
  }, [unreadOnly]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function setRead(submissionId: string, read: boolean) {
    const res = await fetch("/api/cms/testimonial-inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify({ submissionId, read }),
    });
    if (await handleCmsResponse(res, "Submission updated", {})) {
      await load();
      refreshCmsNotifications();
    }
  }

  async function approve(submissionId: string) {
    const res = await fetch("/api/cms/testimonial-inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify({ submissionId, approveToHomepage: true }),
    });
    if (await handleCmsResponse(res, "Approved testimonial", {})) {
      await load();
      refreshCmsNotifications();
    }
  }

  async function reject(submissionId: string) {
    const res = await fetch("/api/cms/testimonial-inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify({ submissionId, status: "rejected", read: true }),
    });
    if (await handleCmsResponse(res, "Rejected submission", {})) {
      await load();
      refreshCmsNotifications();
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">Homepage</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Testimonial inbox</h1>
        <p className="mt-2 text-sm text-slate-600">
          Reviews submitted from the public site. Approve to publish them in the homepage carousel.
        </p>
      </div>

      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
        Show unread only
      </label>

      <div>
        <CmsSectionTitle>Pending submissions ({rows.length})</CmsSectionTitle>
        <ul className="mt-6 space-y-4">
          {rows.length === 0 ? (
            <CmsCard className="p-8 text-center text-sm text-slate-500">No testimonial submissions yet.</CmsCard>
          ) : null}
          {rows.map((r) => (
            <li key={r.id}>
              <CmsCard className={`p-6 ${r.read ? "opacity-90" : "ring-2 ring-gcs-primary/25"}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{r.summaryLine}</span>
                      {!r.read ? (
                        <span className="rounded-full bg-gcs-primary/15 px-2 py-0.5 text-xs font-semibold text-gcs-primary">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>

                    {expanded[r.id] ? (
                      <dl className="mt-4 grid gap-2 border-t border-gcs-border/50 pt-4 text-sm">
                        {r.lines.map((line) => (
                          <div key={line.label} className="grid gap-1 sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-4">
                            <dt className="font-semibold text-slate-500">{line.label}</dt>
                            <dd className="whitespace-pre-wrap text-slate-800">{line.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:items-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-gcs-primary hover:underline"
                      onClick={() => setExpanded((m) => ({ ...m, [r.id]: !m[r.id] }))}
                    >
                      {expanded[r.id] ? (
                        <>
                          Hide details <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          View details <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <CmsButton type="button" className="w-full md:w-auto" onClick={() => void approve(r.id)}>
                      Approve &amp; publish
                    </CmsButton>
                    <CmsButton type="button" variant="ghost" className="w-full md:w-auto" onClick={() => void reject(r.id)}>
                      Reject
                    </CmsButton>
                    {r.read ? (
                      <CmsButton type="button" variant="ghost" className="w-full md:w-auto" onClick={() => void setRead(r.id, false)}>
                        Mark unread
                      </CmsButton>
                    ) : (
                      <CmsButton type="button" variant="ghost" className="w-full md:w-auto" onClick={() => void setRead(r.id, true)}>
                        Mark read
                      </CmsButton>
                    )}
                  </div>
                </div>
              </CmsCard>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

