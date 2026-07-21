"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import { CmsButton, CmsCard } from "@/components/cms/cms-ui";
import { CmsSectionTitle } from "@/components/cms/cms-section-title";
import { ChevronDown, ChevronUp, Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { handleCmsResponse } from "@/lib/cms-toast";
import { refreshCmsNotifications } from "@/components/cms/cms-nav-badges";
import {
  downloadTextFile,
  inboxExportFilename,
  registrationInboxToCsv,
  registrationInboxToExcelXml,
  registrationInboxToJson,
  type InboxExportRow,
} from "@/lib/registration-inbox-export";

type Row = InboxExportRow;

export function RegistrationInboxClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setErr(null);
    const q = unreadOnly ? "?unread=1" : "";
    const res = await fetch(`/api/cms/registration-inbox${q}`, cmsCredentials);
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

  async function setRead(registrationId: string, read: boolean) {
    const res = await fetch("/api/cms/registration-inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify({ registrationId, read }),
    });
    if (await handleCmsResponse(res, "Registration updated", {})) {
      await load();
      refreshCmsNotifications();
    }
  }

  function exportCsv() {
    downloadTextFile(
      inboxExportFilename("csv", unreadOnly),
      registrationInboxToCsv(rows),
      "text/csv;charset=utf-8"
    );
  }

  function exportJson() {
    downloadTextFile(
      inboxExportFilename("json", unreadOnly),
      registrationInboxToJson(rows),
      "application/json;charset=utf-8"
    );
  }

  function exportExcel() {
    downloadTextFile(
      inboxExportFilename("xls", unreadOnly),
      registrationInboxToExcelXml(rows),
      "application/vnd.ms-excel;charset=utf-8"
    );
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">Events</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Registration inbox</h1>
        <p className="mt-2 text-sm text-slate-600">
          Everyone who registered for an event via the public form. Configure fields per event under{" "}
          <Link href="/cms/events" className="font-medium text-gcs-primary hover:underline">
            Events
          </Link>
          .
        </p>
      </div>
      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
          Show unread only
        </label>

        {rows.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Download className="h-3.5 w-3.5" aria-hidden />
              Download
            </span>
            <CmsButton type="button" variant="ghost" onClick={exportExcel}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" aria-hidden />
              Excel
            </CmsButton>
            <CmsButton type="button" variant="ghost" onClick={exportCsv}>
              <FileText className="mr-1.5 h-4 w-4" aria-hidden />
              CSV
            </CmsButton>
            <CmsButton type="button" variant="ghost" onClick={exportJson}>
              <FileJson className="mr-1.5 h-4 w-4" aria-hidden />
              JSON
            </CmsButton>
          </div>
        ) : null}
      </div>

      <div>
        <CmsSectionTitle>Registrations ({rows.length})</CmsSectionTitle>
        <ul className="mt-6 space-y-4">
          {rows.length === 0 ? (
            <CmsCard className="p-8 text-center text-sm text-slate-500">No registrations yet.</CmsCard>
          ) : null}
          {rows.map((r) => (
            <li key={r.id}>
              <CmsCard className={`p-6 ${r.read ? "opacity-90" : "ring-2 ring-gcs-primary/25"}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{r.summaryLine ?? "Registration"}</span>
                      {!r.read ? (
                        <span className="rounded-full bg-gcs-primary/15 px-2 py-0.5 text-xs font-semibold text-gcs-primary">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-600">
                      <Link href={`/cms/events/${r.eventId}`} className="font-medium text-gcs-primary hover:underline">
                        {r.eventTitle}
                      </Link>
                    </p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
                    {expanded[r.id] ? (
                      <dl className="mt-4 grid gap-2 border-t border-gcs-border/50 pt-4 text-sm">
                        {r.lines.map((line) => (
                          <div key={line.label} className="grid gap-1 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4">
                            <dt className="font-semibold text-slate-500">{line.label}</dt>
                            <dd className="whitespace-pre-wrap text-slate-800">
                              {line.href ? (
                                <a
                                  href={line.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-gcs-primary hover:underline"
                                  download={line.value}
                                >
                                  Download {line.value}
                                </a>
                              ) : (
                                line.value
                              )}
                            </dd>
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
                          Hide answers <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          View answers <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    {r.read ? (
                      <CmsButton type="button" variant="ghost" className="w-full md:w-auto" onClick={() => void setRead(r.id, false)}>
                        Mark unread
                      </CmsButton>
                    ) : (
                      <CmsButton type="button" className="w-full md:w-auto" onClick={() => void setRead(r.id, true)}>
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
