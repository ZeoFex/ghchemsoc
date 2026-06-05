"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { RegistrationAnswerValue, RegistrationFieldDef } from "@/lib/event-registration-form";
import { fieldTypeAcceptsMultipleValues } from "@/lib/event-registration-form";
import { gooeyToast } from "@/lib/toast";

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border border-gcs-border bg-white px-4 text-[15px] text-gcs-foreground shadow-sm transition-all placeholder:text-gcs-muted-text/70 focus:border-gcs-primary focus:outline-none focus:ring-2 focus:ring-gcs-primary/20";

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gcs-muted-text";

type Props = {
  eventId: string;
  fields: RegistrationFieldDef[];
};

type FormValues = Record<string, RegistrationAnswerValue>;

function getStringValue(values: FormValues, id: string): string {
  const v = values[id];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function getArrayValue(values: FormValues, id: string): string[] {
  const v = values[id];
  if (Array.isArray(v)) return v;
  return v ? [v] : [];
}

function setStringValue(values: FormValues, id: string, value: string): FormValues {
  return { ...values, [id]: value };
}

function toggleArrayValue(values: FormValues, id: string, option: string, checked: boolean): FormValues {
  const current = getArrayValue(values, id);
  const next = checked ? [...current, option] : current.filter((v) => v !== option);
  return { ...values, [id]: next };
}

export function EventRegistrationForm({ eventId, fields }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    if (f.type === "long_text") {
      return (
        <textarea
          id={fieldId}
          name={f.id}
          required={required}
          rows={4}
          aria-describedby={f.description ? `${fieldId}-help` : undefined}
          className={`${fieldClass} h-auto min-h-[7rem] resize-y py-3`}
          value={getStringValue(values, f.id)}
          onChange={(e) => setValues((v) => setStringValue(v, f.id, e.target.value))}
        />
      );
    }

    if (f.type === "dropdown") {
      return (
        <select
          id={fieldId}
          name={f.id}
          required={required}
          aria-describedby={f.description ? `${fieldId}-help` : undefined}
          className={fieldClass}
          value={getStringValue(values, f.id)}
          onChange={(e) => setValues((v) => setStringValue(v, f.id, e.target.value))}
        >
          <option value="">{required ? "Select an option…" : "Optional"}</option>
          {(f.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (f.type === "radio") {
      return (
        <fieldset className="mt-2 space-y-2" aria-describedby={f.description ? `${fieldId}-help` : undefined}>
          <legend className="sr-only">{f.label}</legend>
          {(f.options ?? []).map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gcs-border/70 bg-white px-4 py-3 text-sm text-gcs-foreground transition-colors hover:border-gcs-primary/40">
              <input
                type="radio"
                name={f.id}
                value={opt}
                required={required && !getStringValue(values, f.id)}
                checked={getStringValue(values, f.id) === opt}
                onChange={() => setValues((v) => setStringValue(v, f.id, opt))}
                className="h-4 w-4 border-gcs-border text-gcs-primary focus:ring-gcs-primary/30"
              />
              {opt}
            </label>
          ))}
        </fieldset>
      );
    }

    if (f.type === "checkbox" || f.type === "multi_select") {
      const selected = getArrayValue(values, f.id);
      return (
        <fieldset className="mt-2 space-y-2" aria-describedby={f.description ? `${fieldId}-help` : undefined}>
          <legend className="sr-only">{f.label}</legend>
          {(f.options ?? []).map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gcs-border/70 bg-white px-4 py-3 text-sm text-gcs-foreground transition-colors hover:border-gcs-primary/40">
              <input
                type="checkbox"
                name={`${f.id}[]`}
                value={opt}
                checked={selected.includes(opt)}
                onChange={(e) =>
                  setValues((v) => toggleArrayValue(v, f.id, opt, e.target.checked))
                }
                className="h-4 w-4 rounded border-gcs-border text-gcs-primary focus:ring-gcs-primary/30"
              />
              {opt}
            </label>
          ))}
        </fieldset>
      );
    }

    const inputType =
      f.type === "email" ? "email" : f.type === "tel" ? "tel" : f.type === "number" ? "number" : f.type === "date" ? "date" : "text";

    return (
      <input
        id={fieldId}
        name={f.id}
        type={inputType}
        required={required}
        aria-describedby={f.description ? `${fieldId}-help` : undefined}
        className={fieldClass}
        value={getStringValue(values, f.id)}
        onChange={(e) => setValues((v) => setStringValue(v, f.id, e.target.value))}
      />
    );
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {fields.map((f) => (
        <div key={f.id}>
          {f.type === "radio" || fieldTypeAcceptsMultipleValues(f.type) ? (
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
      ))}
      <div className="border-t border-gcs-border/60 pt-6">
        <button
          type="submit"
          disabled={submitting}
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
