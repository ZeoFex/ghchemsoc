"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type {
  RegistrationAnswerValue,
  RegistrationFieldDef,
  RegistrationFileAnswer,
} from "@/lib/event-registration-form";
import {
  fieldTypeAcceptsMultipleValues,
  fieldTypeIsFile,
  isImageFileAnswer,
  normalizeFileAccept,
  parseRegistrationFileAnswer,
  toHtmlFileAccept,
} from "@/lib/event-registration-form";
import { gooeyToast } from "@/lib/toast";

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border border-gcs-border bg-white px-4 text-[15px] text-gcs-foreground shadow-sm transition-all placeholder:text-gcs-muted-text/70 focus:border-gcs-primary focus:outline-none focus:ring-2 focus:ring-gcs-primary/20";

const selectClass = `${fieldClass} cursor-pointer appearance-auto pr-10`;

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gcs-muted-text";

const optionCardBase =
  "flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm text-gcs-foreground transition-colors hover:border-gcs-primary/40 focus-within:border-gcs-primary focus-within:ring-2 focus-within:ring-gcs-primary/20";

type Props = {
  eventId: string;
  fields: RegistrationFieldDef[];
};

type FormValues = Record<string, RegistrationAnswerValue>;

function getStringValue(values: FormValues, id: string): string {
  const v = values[id];
  if (v == null || Array.isArray(v) || parseRegistrationFileAnswer(v)) return "";
  return typeof v === "string" ? v : "";
}

function getArrayValue(values: FormValues, id: string): string[] {
  const v = values[id];
  if (Array.isArray(v)) return v;
  return typeof v === "string" && v ? [v] : [];
}

function setStringValue(values: FormValues, id: string, value: string): FormValues {
  return { ...values, [id]: value };
}

function toggleArrayValue(values: FormValues, id: string, option: string, checked: boolean): FormValues {
  const current = getArrayValue(values, id);
  const next = checked ? [...current, option] : current.filter((v) => v !== option);
  return { ...values, [id]: next };
}

function selectRadioOption(
  setValues: (updater: (v: FormValues) => FormValues) => void,
  fieldId: string,
  option: string
) {
  setValues((v) => setStringValue(v, fieldId, option));
}

export function EventRegistrationForm({ eventId, fields }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({});

  async function uploadFile(field: RegistrationFieldDef, file: File | null) {
    if (!file) {
      setValues((v) => {
        const next = { ...v };
        delete next[field.id];
        return next;
      });
      return;
    }

    setUploadingFieldId(field.id);
    try {
      const body = new FormData();
      body.set("eventId", eventId);
      body.set("fieldId", field.id);
      body.set("file", file);
      const res = await fetch("/api/public/event-registration-upload", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        file?: RegistrationFileAnswer;
      };
      if (!res.ok || !data.file) {
        gooeyToast.error("Upload failed", {
          description: data.error ?? "Could not upload that file.",
          preset: "smooth",
          spring: false,
        });
        return;
      }
      setValues((v) => ({ ...v, [field.id]: data.file! }));
    } finally {
      setUploadingFieldId(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploadingFieldId) {
      gooeyToast.error("Please wait", {
        description: "A file is still uploading.",
        preset: "smooth",
        spring: false,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/event-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, answers: values }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        gooeyToast.error("Could not submit registration", {
          description: data.error ?? "Please check the form and try again.",
          preset: "smooth",
          spring: false,
        });
        return;
      }
      gooeyToast.success("Registration submitted", {
        description: "The organisers will follow up if needed.",
        preset: "smooth",
        spring: false,
      });
      router.push(`/events/${eventId}?registered=1`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(f: RegistrationFieldDef) {
    const fieldId = `reg-${f.id}`;
    const required = Boolean(f.required);
    const options = (f.options ?? []).map((opt) => opt.trim()).filter(Boolean);

    if (f.type === "long_text") {
      return (
        <textarea
          id={fieldId}
          name={f.id}
          required={required}
          rows={4}
          placeholder={f.placeholder}
          aria-describedby={f.description ? `${fieldId}-help` : undefined}
          className={`${fieldClass} h-auto min-h-[7rem] resize-y py-3`}
          value={getStringValue(values, f.id)}
          onChange={(e) => setValues((v) => setStringValue(v, f.id, e.target.value))}
          onKeyDown={(e) => {
            // Keep Enter as newline — do not let the form treat it as submit.
            if (e.key === "Enter") e.stopPropagation();
          }}
        />
      );
    }

    if (f.type === "dropdown") {
      const current = getStringValue(values, f.id);
      return (
        <select
          id={fieldId}
          name={f.id}
          required={required}
          aria-describedby={f.description ? `${fieldId}-help` : undefined}
          className={selectClass}
          value={current}
          onChange={(e) => setValues((v) => setStringValue(v, f.id, e.target.value))}
          onKeyDown={(e) => {
            // Enter commits the focused option in most browsers; keep it from submitting the form early.
            if (e.key === "Enter") e.stopPropagation();
          }}
        >
          <option value="">{required ? "Select an option…" : "Optional"}</option>
          {options.map((opt, idx) => (
            <option key={`${f.id}-opt-${idx}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (f.type === "radio") {
      const selected = getStringValue(values, f.id);
      return (
        <fieldset className="mt-2 space-y-2" aria-describedby={f.description ? `${fieldId}-help` : undefined}>
          <legend className="sr-only">{f.label}</legend>
          {options.map((opt, idx) => {
            const inputId = `${fieldId}-${idx}`;
            const isSelected = selected === opt;
            return (
              <label
                key={`${f.id}-radio-${idx}`}
                htmlFor={inputId}
                className={`${optionCardBase} ${
                  isSelected ? "border-gcs-primary bg-gcs-primary/5 ring-1 ring-gcs-primary/30" : "border-gcs-border/70"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    selectRadioOption(setValues, f.id, opt);
                  }
                }}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={f.id}
                  value={opt}
                  required={required && !selected}
                  checked={isSelected}
                  onChange={() => selectRadioOption(setValues, f.id, opt)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      selectRadioOption(setValues, f.id, opt);
                    }
                  }}
                  className="h-4 w-4 border-gcs-border text-gcs-primary focus:ring-gcs-primary/30"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </fieldset>
      );
    }

    if (f.type === "checkbox" || f.type === "multi_select") {
      const selected = getArrayValue(values, f.id);
      return (
        <fieldset className="mt-2 space-y-2" aria-describedby={f.description ? `${fieldId}-help` : undefined}>
          <legend className="sr-only">{f.label}</legend>
          {options.map((opt, idx) => {
            const inputId = `${fieldId}-${idx}`;
            const checked = selected.includes(opt);
            return (
              <label
                key={`${f.id}-check-${idx}`}
                htmlFor={inputId}
                className={`${optionCardBase} ${
                  checked ? "border-gcs-primary bg-gcs-primary/5 ring-1 ring-gcs-primary/30" : "border-gcs-border/70"
                }`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  name={`${f.id}[]`}
                  value={opt}
                  checked={checked}
                  onChange={(e) => setValues((v) => toggleArrayValue(v, f.id, opt, e.target.checked))}
                  className="h-4 w-4 rounded border-gcs-border text-gcs-primary focus:ring-gcs-primary/30"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </fieldset>
      );
    }

    if (fieldTypeIsFile(f.type)) {
      const uploaded = parseRegistrationFileAnswer(values[f.id]);
      const uploading = uploadingFieldId === f.id;
      const showImage = uploaded && isImageFileAnswer(uploaded);
      return (
        <div className="mt-2 space-y-3">
          <input
            id={fieldId}
            name={f.id}
            type="file"
            required={required && !uploaded}
            accept={toHtmlFileAccept(f.accept)}
            aria-describedby={f.description ? `${fieldId}-help` : undefined}
            disabled={uploading || submitting}
            className="block w-full cursor-pointer text-sm text-gcs-muted-text file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-gcs-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gcs-primary hover:file:bg-gcs-primary/15"
            onChange={(e) => void uploadFile(f, e.target.files?.[0] ?? null)}
          />
          {uploading ? (
            <p className="flex items-center gap-2 text-sm text-gcs-muted-text">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Uploading…
            </p>
          ) : null}
          {uploaded && !uploading ? (
            <div className="flex flex-wrap items-start gap-4">
              {showImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploaded.url}
                  alt={uploaded.fileName}
                  className="h-28 w-28 rounded-xl border border-gcs-border/70 object-cover"
                />
              ) : null}
              <div className="min-w-0 text-sm text-gcs-foreground">
                <p>
                  Uploaded: <span className="font-medium">{uploaded.fileName}</span>
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-red-700 hover:underline"
                  onClick={() => void uploadFile(f, null)}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
          <p className="text-xs text-gcs-muted-text">
            Allowed: {normalizeFileAccept(f.accept)} · Max 10 MB
          </p>
        </div>
      );
    }

    const inputType =
      f.type === "email"
        ? "email"
        : f.type === "tel"
          ? "tel"
          : f.type === "number"
            ? "number"
            : f.type === "date"
              ? "date"
              : "text";

    return (
      <input
        id={fieldId}
        name={f.id}
        type={inputType}
        required={required}
        placeholder={f.placeholder}
        aria-describedby={f.description ? `${fieldId}-help` : undefined}
        className={fieldClass}
        value={getStringValue(values, f.id)}
        onChange={(e) => setValues((v) => setStringValue(v, f.id, e.target.value))}
      />
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={onSubmit}
      noValidate
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Always allow Enter to insert a new line in multi-line fields.
        if (target.tagName === "TEXTAREA" || target.closest("textarea")) return;

        const tag = target.tagName;
        if (tag === "BUTTON") return;
        if (tag === "INPUT" && (target as HTMLInputElement).type === "submit") return;

        if (tag === "INPUT") {
          const type = (target as HTMLInputElement).type;
          if (type === "radio" || type === "checkbox" || type === "file") {
            e.preventDefault();
          } else if (type === "text" || type === "email" || type === "tel" || type === "number" || type === "date") {
            // Single-line fields: Enter should not submit the whole registration.
            e.preventDefault();
          }
        }
        if (tag === "SELECT" || target.closest("select")) {
          e.preventDefault();
        }
      }}
    >
      {fields.map((f) => {
        if (f.type === "section") {
          return (
            <div key={f.id} className="border-t border-gcs-border/70 pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold tracking-tight text-gcs-foreground">{f.label}</h2>
              {f.description ? <p className="mt-1 text-sm text-gcs-muted-text">{f.description}</p> : null}
            </div>
          );
        }

        if (f.type === "paragraph") {
          return (
            <div key={f.id} className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-gcs-muted-text">
              <p className="font-medium text-gcs-foreground">{f.label}</p>
              {f.description ? <p className="mt-1 whitespace-pre-wrap">{f.description}</p> : null}
            </div>
          );
        }

        return (
          <div key={f.id}>
            {f.type === "radio" || fieldTypeAcceptsMultipleValues(f.type) || fieldTypeIsFile(f.type) ? (
              <p className={labelClass}>
                {f.label}
                {f.required ? <span className="text-red-600"> *</span> : null}
              </p>
            ) : (
              <label htmlFor={`reg-${f.id}`} className={labelClass}>
                {f.label}
                {f.required ? <span className="text-red-600"> *</span> : null}
              </label>
            )}
            {f.description ? (
              <p id={`reg-${f.id}-help`} className="mt-1 text-sm text-gcs-muted-text">
                {f.description}
              </p>
            ) : null}
            {renderField(f)}
          </div>
        );
      })}
      <div className="border-t border-gcs-border/60 pt-6">
        <button
          type="submit"
          disabled={submitting || Boolean(uploadingFieldId)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gcs-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-gcs-primary-hover disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Submit registration
        </button>
        <p className="mt-4 text-xs leading-relaxed text-gcs-muted-text">
          By submitting, you agree that the Ghana Chemical Society may contact you about this event.
        </p>
      </div>
    </form>
  );
}
