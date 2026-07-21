"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { CmsButton, CmsFieldLabel, CmsInput, CmsTextarea } from "@/components/cms/cms-ui";
import type { RegistrationFieldDef, RegistrationFieldType } from "@/lib/event-registration-form";
import {
  DEFAULT_FILE_ACCEPT,
  REGISTRATION_FIELD_TYPE_OPTIONS,
  createEmptyRegistrationField,
  defaultOptionsForFieldType,
  fieldTypeIsFile,
  fieldTypeIsLayout,
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
        required: fieldTypeIsLayout(type) ? false : current.required,
        options: fieldTypeNeedsOptions(type)
          ? current.options?.length
            ? current.options
            : defaultOptionsForFieldType(type)
          : undefined,
        accept: fieldTypeIsFile(type) ? current.accept || DEFAULT_FILE_ACCEPT : undefined,
        placeholder: fieldTypeIsLayout(type) || fieldTypeIsFile(type) ? undefined : current.placeholder,
      })
    );
  }

  return (
    <div className="space-y-4" data-registration-form-builder>
      {fields.map((f, i) => (
        <div key={`${f.id}-${i}`} className="rounded-xl border border-gcs-border/70 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gcs-muted-text">
              {fieldTypeIsLayout(f.type) ? (f.type === "section" ? "Section" : "Text block") : `Field ${i + 1}`}
            </span>
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
            {!fieldTypeIsLayout(f.type) ? (
              <label>
                <CmsFieldLabel>Field id</CmsFieldLabel>
                <CmsInput
                  value={f.id}
                  onChange={(e) => onChange(updateField(fields, i, { id: e.target.value }))}
                  placeholder="full_name"
                />
              </label>
            ) : (
              <label>
                <CmsFieldLabel>Block id</CmsFieldLabel>
                <CmsInput
                  value={f.id}
                  onChange={(e) => onChange(updateField(fields, i, { id: e.target.value }))}
                  placeholder="section_abstract"
                />
              </label>
            )}
            <label>
              <CmsFieldLabel>{f.type === "paragraph" ? "Title" : "Label"}</CmsFieldLabel>
              <CmsInput
                value={f.label}
                onChange={(e) => onChange(updateField(fields, i, { label: e.target.value }))}
                placeholder={
                  f.type === "section" ? "Abstract submission" : f.type === "paragraph" ? "Instructions" : "Full name"
                }
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
            {!fieldTypeIsLayout(f.type) ? (
              <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(f.required)}
                  onChange={(e) => onChange(updateField(fields, i, { required: e.target.checked }))}
                />
                Required
              </label>
            ) : (
              <div />
            )}
            <label className="md:col-span-2">
              <CmsFieldLabel>
                {f.type === "section"
                  ? "Subtitle (optional)"
                  : f.type === "paragraph"
                    ? "Body text"
                    : "Help text (optional)"}
              </CmsFieldLabel>
              <CmsTextarea
                rows={f.type === "paragraph" ? 4 : 2}
                value={f.description ?? ""}
                onChange={(e) => onChange(updateField(fields, i, { description: e.target.value || undefined }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.stopPropagation();
                }}
                placeholder={
                  f.type === "paragraph"
                    ? "Shown as descriptive text on the public form — press Enter for a new line"
                    : "Shown below the label on the public form — press Enter for a new line"
                }
              />
            </label>
            {!fieldTypeIsLayout(f.type) && !fieldTypeIsFile(f.type) ? (
              <label className="md:col-span-2">
                <CmsFieldLabel>Placeholder (optional)</CmsFieldLabel>
                <CmsInput
                  value={f.placeholder ?? ""}
                  onChange={(e) => onChange(updateField(fields, i, { placeholder: e.target.value || undefined }))}
                  placeholder="Hint inside the input"
                />
              </label>
            ) : null}
            {fieldTypeIsFile(f.type) ? (
              <label className="md:col-span-2">
                <CmsFieldLabel>Allowed extensions (comma-separated)</CmsFieldLabel>
                <CmsInput
                  value={f.accept ?? DEFAULT_FILE_ACCEPT}
                  onChange={(e) => onChange(updateField(fields, i, { accept: e.target.value || DEFAULT_FILE_ACCEPT }))}
                  placeholder={DEFAULT_FILE_ACCEPT}
                />
                <p className="mt-1 text-xs text-gcs-muted-text">
                  Example: .pdf,.jpg,.png,.webp — includes images by default. Max 10 MB per file.
                </p>
              </label>
            ) : null}
            {fieldTypeNeedsOptions(f.type) ? (
              <div className="md:col-span-2 space-y-3">
                <label className="block">
                  <CmsFieldLabel>Options (one per line)</CmsFieldLabel>
                  <CmsTextarea
                    rows={4}
                    value={(f.options ?? []).join("\n")}
                    onChange={(e) =>
                      onChange(
                        updateField(fields, i, {
                          // Keep blank lines while typing so Enter can move to the next line.
                          // Empty lines are cleaned when the form is saved.
                          options: e.target.value.split("\n"),
                        })
                      )
                    }
                    onKeyDown={(e) => {
                      // Enter must insert a new line / next option — never submit the parent CMS form.
                      if (e.key === "Enter") e.stopPropagation();
                    }}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                  />
                  <p className="mt-1 text-xs text-gcs-muted-text">Press Enter to move to the next line for each option.</p>
                </label>
                {(f.options ?? []).some((opt) => opt.trim()) ? (
                  <div className="rounded-xl border border-dashed border-gcs-border/80 bg-neutral-50/80 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gcs-muted-text">
                      Preview
                    </p>
                    {f.type === "dropdown" ? (
                      <select
                        className="h-11 w-full max-w-md cursor-pointer rounded-xl border border-gcs-border bg-white px-3 text-sm"
                        defaultValue=""
                        aria-label={`${f.label || "Field"} preview`}
                      >
                        <option value="" disabled>
                          Select an option…
                        </option>
                        {(f.options ?? [])
                          .map((opt) => opt.trim())
                          .filter(Boolean)
                          .map((opt, idx) => (
                          <option key={`${f.id}-preview-${idx}`} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "radio" ? (
                      <div className="space-y-2" role="radiogroup" aria-label={`${f.label || "Field"} preview`}>
                        {(f.options ?? [])
                          .map((opt) => opt.trim())
                          .filter(Boolean)
                          .map((opt, idx) => (
                          <label
                            key={`${f.id}-preview-radio-${idx}`}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-gcs-border/70 bg-white px-4 py-3 text-sm text-gcs-foreground"
                          >
                            <input
                              type="radio"
                              name={`preview-${f.id}`}
                              value={opt}
                              className="h-4 w-4 border-gcs-border text-gcs-primary"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  (e.currentTarget as HTMLInputElement).checked = true;
                                  e.currentTarget.dispatchEvent(new Event("change", { bubbles: true }));
                                }
                              }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(f.options ?? [])
                          .map((opt) => opt.trim())
                          .filter(Boolean)
                          .map((opt, idx) => (
                          <label
                            key={`${f.id}-preview-check-${idx}`}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-gcs-border/70 bg-white px-4 py-3 text-sm text-gcs-foreground"
                          >
                            <input
                              type="checkbox"
                              value={opt}
                              className="h-4 w-4 rounded border-gcs-border text-gcs-primary"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="text-sm font-medium text-red-700 hover:underline"
              onClick={() => onChange(fields.filter((_, j) => j !== i).map((row, idx) => ({ ...row, sortOrder: idx })))}
            >
              Remove
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
