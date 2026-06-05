"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { CmsButton, CmsFieldLabel, CmsInput, CmsTextarea } from "@/components/cms/cms-ui";
import type { RegistrationFieldDef, RegistrationFieldType } from "@/lib/event-registration-form";
import {
  REGISTRATION_FIELD_TYPE_OPTIONS,
  createEmptyRegistrationField,
  defaultOptionsForFieldType,
  fieldTypeNeedsOptions,
  normalizeRegistrationFieldType,
} from "@/lib/event-registration-form";

type Props = {
  fields: RegistrationFieldDef[];
  onChange: (fields: RegistrationFieldDef[]) => void;
};

function moveField(fields: RegistrationFieldDef[], index: number, direction: -1 | 1): RegistrationFieldDef[] {
  const next = [...fields];
  const target = index + direction;
  if (target < 0 || target >= next.length) return fields;
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((f, i) => ({ ...f, sortOrder: i }));
}

function updateField(fields: RegistrationFieldDef[], index: number, patch: Partial<RegistrationFieldDef>): RegistrationFieldDef[] {
  return fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
}

export function EventRegistrationFormBuilder({ fields, onChange }: Props) {
  function setType(index: number, rawType: string) {
    const type = normalizeRegistrationFieldType(rawType) as RegistrationFieldType;
    const current = fields[index];
    onChange(
      updateField(fields, index, {
        type,
        options: fieldTypeNeedsOptions(type)
          ? current.options?.length
            ? current.options
            : defaultOptionsForFieldType(type)
          : undefined,
      })
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((f, i) => (
        <div key={`${f.id}-${i}`} className="rounded-xl border border-gcs-border/70 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gcs-muted-text">Field {i + 1}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-lg border border-gcs-border p-1.5 text-gcs-muted-text hover:bg-neutral-50 disabled:opacity-40"
                disabled={i === 0}
                onClick={() => onChange(moveField(fields, i, -1))}
                aria-label="Move field up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-gcs-border p-1.5 text-gcs-muted-text hover:bg-neutral-50 disabled:opacity-40"
                disabled={i === fields.length - 1}
                onClick={() => onChange(moveField(fields, i, 1))}
                aria-label="Move field down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <CmsFieldLabel>Field id</CmsFieldLabel>
              <CmsInput
                value={f.id}
                onChange={(e) => onChange(updateField(fields, i, { id: e.target.value }))}
                placeholder="full_name"
              />
            </label>
            <label>
              <CmsFieldLabel>Label</CmsFieldLabel>
              <CmsInput
                value={f.label}
                onChange={(e) => onChange(updateField(fields, i, { label: e.target.value }))}
                placeholder="Full name"
              />
            </label>
            <label>
              <CmsFieldLabel>Type</CmsFieldLabel>
              <select
                className="mt-1 w-full rounded-xl border border-gcs-border bg-white px-3 py-2 text-sm"
                value={f.type}
                onChange={(e) => setType(i, e.target.value)}
              >
                {REGISTRATION_FIELD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={Boolean(f.required)}
                onChange={(e) => onChange(updateField(fields, i, { required: e.target.checked }))}
              />
              Required
            </label>
            <label className="md:col-span-2">
              <CmsFieldLabel>Help text (optional)</CmsFieldLabel>
              <CmsInput
                value={f.description ?? ""}
                onChange={(e) => onChange(updateField(fields, i, { description: e.target.value || undefined }))}
                placeholder="Shown below the label on the public form"
              />
            </label>
            {fieldTypeNeedsOptions(f.type) ? (
              <label className="md:col-span-2">
                <CmsFieldLabel>Options (one per line)</CmsFieldLabel>
                <CmsTextarea
                  rows={4}
                  value={(f.options ?? []).join("\n")}
                  onChange={(e) =>
                    onChange(
                      updateField(fields, i, {
                        options: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    )
                  }
                />
              </label>
            ) : null}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="text-sm font-medium text-red-700 hover:underline"
              onClick={() => onChange(fields.filter((_, j) => j !== i).map((row, idx) => ({ ...row, sortOrder: idx })))}
            >
              Remove field
            </button>
          </div>
        </div>
      ))}
      <CmsButton
        type="button"
        variant="ghost"
        onClick={() => onChange([...fields, createEmptyRegistrationField(fields.length)])}
      >
        Add field
      </CmsButton>
    </div>
  );
}
