"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cmsCredentials, CMS_UNAUTHORIZED_MESSAGE } from "@/lib/cms-fetch";
import type { RegistrationAnswerValue, RegistrationFieldDef } from "@/lib/event-registration-form";
import {
  cleanRegistrationFormFields,
  createEmptyRegistrationField,
  parseRegistrationFormFields,
  registrationsToCsv,
  validateRegistrationFormFields,
} from "@/lib/event-registration-form";
import type { Prisma } from "@prisma/client";
import { CmsButton, CmsCard } from "@/components/cms/cms-ui";
import { CmsSectionTitle } from "@/components/cms/cms-section-title";
import { EventRegistrationFormBuilder } from "@/components/cms/event-registration-form-builder";
import { ArrowLeft, ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
import { handleCmsResponse } from "@/lib/cms-toast";
import { refreshCmsNotifications } from "@/components/cms/cms-nav-badges";

type RegRow = {
  id: string;
  createdAt: string;
  read: boolean;
  summaryLine: string | null;
  lines: { label: string; value: string }[];
  rawResponses: Record<string, RegistrationAnswerValue>;
};

export function EventRegistrationsClient({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<RegistrationFieldDef[]>([]);
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [savingFields, setSavingFields] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/cms/society-events/${eventId}/registrations`, cmsCredentials);
    if (!res.ok) {
      setErr(res.status === 401 ? CMS_UNAUTHORIZED_MESSAGE : await res.text());
      setLoading(false);
      return;
    }
    const data = (await res.json()) as {
      event: { title: string; registrationFormFields: unknown };
      registrations: RegRow[];
    };
    setTitle(data.event.title);
    const parsed = parseRegistrationFormFields(data.event.registrationFormFields as Prisma.JsonValue);
    setFields(parsed.length ? parsed : [createEmptyRegistrationField()]);
    setRegs(data.registrations);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveFormDefinition() {
    setSavingFields(true);
    setErr(null);
    const cleaned = cleanRegistrationFormFields(fields);
    const validationErr = validateRegistrationFormFields(cleaned);
    if (validationErr) {
      setErr(validationErr);
      setSavingFields(false);
      return;
    }
    const res = await fetch(`/api/cms/society-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify({ registrationFormFields: cleaned.length ? cleaned : null }),
    });
    setSavingFields(false);
    if (await handleCmsResponse(res, "Registration form saved", { setErr })) {
      setFields(cleaned.length ? cleaned : [createEmptyRegistrationField()]);
      await load();
    }
  }

  function exportCsv() {
    const formFields = parseRegistrationFormFields(fields as unknown as Prisma.JsonValue);
    const csv = registrationsToCsv(
      formFields,
      regs.map((r) => ({ createdAt: r.createdAt, answers: r.rawResponses }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleRead(registrationId: string, read: boolean) {
    const res = await fetch(`/api/cms/society-events/${eventId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      ...cmsCredentials,
      body: JSON.stringify({ registrationId, read }),
    });
    if (await handleCmsResponse(res, read ? "Marked as read" : "Marked as unread", { setErr })) {
      setRegs((prev) => prev.map((r) => (r.id === registrationId ? { ...r, read } : r)));
      refreshCmsNotifications();
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-gcs-muted-text">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <Link href="/cms/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-gcs-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All events
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">Registrations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gcs-foreground md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-gcs-muted-text">
          Design a custom registration form (like Google Forms) for this event. Submissions also appear in{" "}
          <Link href="/cms/registration-inbox" className="font-medium text-gcs-primary hover:underline">
            Registration inbox
          </Link>
          .
        </p>
      </div>
      {err ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}

      <CmsCard className="p-8">
        <CmsSectionTitle>Registration form builder</CmsSectionTitle>
        <p className="mt-2 text-sm text-gcs-muted-text">
          Add fields, reorder them, and choose types (short answer, paragraph, email, dropdown, radio, checkboxes, and more).
          Use stable field IDs — they are stored with each answer.
        </p>
        <div className="mt-6">
          <EventRegistrationFormBuilder fields={fields} onChange={setFields} />
        </div>
        <div className="mt-4">
          <CmsButton type="button" onClick={() => void saveFormDefinition()} disabled={savingFields}>
            {savingFields ? "Saving…" : "Save form"}
          </CmsButton>
        </div>
      </CmsCard>

      <CmsCard className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CmsSectionTitle>Submissions ({regs.length})</CmsSectionTitle>
          {regs.length > 0 ? (
            <CmsButton type="button" variant="ghost" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Export CSV
            </CmsButton>
          ) : null}
        </div>
        {regs.length === 0 ? (
          <p className="mt-4 text-sm text-gcs-muted-text">No registrations yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {regs.map((r) => (
              <li key={r.id} className="rounded-xl border border-gcs-border/70 bg-white">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gcs-muted-text">
                      {new Date(r.createdAt).toLocaleString()}
                      {r.read ? "" : " · New"}
                    </p>
                    <p className="mt-1 font-medium text-gcs-foreground">{r.summaryLine ?? "Registration"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gcs-muted-text">
                      <input type="checkbox" checked={r.read} onChange={(e) => void toggleRead(r.id, e.target.checked)} />
                      Mark read
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-gcs-border px-3 py-1.5 text-sm font-medium text-gcs-foreground hover:bg-neutral-50"
                      onClick={() => setExpanded((m) => ({ ...m, [r.id]: !m[r.id] }))}
                    >
                      {expanded[r.id] ? (
                        <>
                          Hide <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          View answers <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {expanded[r.id] ? (
                  <div className="border-t border-gcs-border/60 bg-neutral-50/50 px-4 py-4">
                    <dl className="grid gap-2 text-sm">
                      {r.lines.map((line) => (
                        <div key={line.label} className="grid gap-1 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-4">
                          <dt className="font-semibold text-gcs-muted-text">{line.label}</dt>
                          <dd className="whitespace-pre-wrap text-gcs-foreground">{line.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CmsCard>
    </div>
  );
}
