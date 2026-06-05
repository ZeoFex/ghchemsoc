import { z } from "zod";
import type { Prisma } from "@prisma/client";

/** Canonical field types (Google Forms–style). Legacy aliases are normalized on parse. */
export const REGISTRATION_FIELD_TYPE_VALUES = [
  "short_text",
  "long_text",
  "email",
  "tel",
  "number",
  "date",
  "dropdown",
  "radio",
  "checkbox",
  "multi_select",
] as const;

export type RegistrationFieldType = (typeof REGISTRATION_FIELD_TYPE_VALUES)[number];

/** Human labels for CMS type picker. */
export const REGISTRATION_FIELD_TYPE_OPTIONS: { value: RegistrationFieldType; label: string }[] = [
  { value: "short_text", label: "Short answer" },
  { value: "long_text", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Multiple choice (single)" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "multi_select", label: "Select multiple" },
];

const LEGACY_TYPE_MAP: Record<string, RegistrationFieldType> = {
  text: "short_text",
  textarea: "long_text",
  select: "dropdown",
};

export function normalizeRegistrationFieldType(raw: string): RegistrationFieldType {
  const mapped = LEGACY_TYPE_MAP[raw] ?? raw;
  if ((REGISTRATION_FIELD_TYPE_VALUES as readonly string[]).includes(mapped)) {
    return mapped as RegistrationFieldType;
  }
  return "short_text";
}

export function fieldTypeNeedsOptions(type: RegistrationFieldType): boolean {
  return type === "dropdown" || type === "radio" || type === "checkbox" || type === "multi_select";
}

export function fieldTypeAcceptsMultipleValues(type: RegistrationFieldType): boolean {
  return type === "checkbox" || type === "multi_select";
}

const registrationFieldTypeSchema = z.preprocess(
  (val) => (typeof val === "string" ? normalizeRegistrationFieldType(val) : val),
  z.enum(REGISTRATION_FIELD_TYPE_VALUES)
);

export const registrationFieldDefSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  type: registrationFieldTypeSchema,
  required: z.boolean().optional(),
  options: z.array(z.string().min(1)).max(50).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export type RegistrationFieldDef = z.infer<typeof registrationFieldDefSchema>;

/** Lenient schema for parsing stored JSON (accepts legacy type strings). */
const registrationFieldDefParseSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  type: z.string().min(1),
  required: z.boolean().optional(),
  options: z.array(z.string().min(1)).max(50).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const registrationFormFieldsSchema = z.array(registrationFieldDefSchema).max(40);

export type RegistrationAnswerValue = string | string[];

export function parseRegistrationFormFields(raw: Prisma.JsonValue | null | undefined): RegistrationFieldDef[] {
  if (raw == null || !Array.isArray(raw)) return [];
  const parsed: RegistrationFieldDef[] = [];
  for (const item of raw) {
    const row = registrationFieldDefParseSchema.safeParse(item);
    if (!row.success) continue;
    const type = normalizeRegistrationFieldType(row.data.type);
    parsed.push({
      ...row.data,
      type,
      options: fieldTypeNeedsOptions(type) ? row.data.options : undefined,
    });
  }
  return parsed.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function hasRegistrationForm(raw: Prisma.JsonValue | null | undefined): boolean {
  return parseRegistrationFormFields(raw).length > 0;
}

/** New row in CMS registration form builders (stable id generated per row). */
export function createEmptyRegistrationField(sortOrder = 0): RegistrationFieldDef {
  return {
    id: `field_${Math.random().toString(36).slice(2, 9)}`,
    label: "",
    type: "short_text",
    required: true,
    sortOrder,
  };
}

export function defaultOptionsForFieldType(type: RegistrationFieldType): string[] {
  if (!fieldTypeNeedsOptions(type)) return [];
  return ["Option 1", "Option 2", "Option 3"];
}

/** Clean and validate field definitions before save (CMS). */
export function cleanRegistrationFormFields(fields: RegistrationFieldDef[]): RegistrationFieldDef[] {
  return fields
    .map((f, index) => {
      const type = normalizeRegistrationFieldType(f.type);
      const options = fieldTypeNeedsOptions(type)
        ? (f.options ?? []).map((o) => o.trim()).filter(Boolean)
        : undefined;
      return {
        id: f.id.trim() || `field_${Math.random().toString(36).slice(2, 9)}`,
        label: f.label.trim(),
        type,
        required: Boolean(f.required),
        description: f.description?.trim() || undefined,
        sortOrder: f.sortOrder ?? index,
        options,
      };
    })
    .filter((f) => f.label.length > 0);
}

export function validateRegistrationFormFields(fields: RegistrationFieldDef[]): string | null {
  for (const f of fields) {
    if (fieldTypeNeedsOptions(f.type) && !(f.options?.length)) {
      return `"${f.label || f.id}" needs at least one option.`;
    }
  }
  return null;
}

function normalizeRawAnswer(value: unknown): RegistrationAnswerValue {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function normalizeAnswers(input: unknown): Record<string, RegistrationAnswerValue> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, RegistrationAnswerValue> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    out[k] = normalizeRawAnswer(v);
  }
  return out;
}

function answerAsString(value: RegistrationAnswerValue): string {
  if (Array.isArray(value)) return value.join(", ");
  return value.trim();
}

export function validateRegistrationAnswers(
  fields: RegistrationFieldDef[],
  answers: unknown
): { ok: true; answers: Record<string, RegistrationAnswerValue> } | { ok: false; error: string } {
  const normalized = normalizeAnswers(answers);

  for (const f of fields) {
    const raw = normalized[f.id] ?? (fieldTypeAcceptsMultipleValues(f.type) ? [] : "");
    const val = fieldTypeAcceptsMultipleValues(f.type)
      ? (Array.isArray(raw) ? raw : raw ? [String(raw).trim()] : [])
      : (Array.isArray(raw) ? raw[0] ?? "" : String(raw)).trim();

    if (f.required && (Array.isArray(val) ? val.length === 0 : !val)) {
      return { ok: false, error: `Missing required field: ${f.label}` };
    }

    if (Array.isArray(val)) {
      if (!val.length) {
        normalized[f.id] = [];
        continue;
      }
      if (f.options?.length) {
        for (const choice of val) {
          if (!f.options.includes(choice)) {
            return { ok: false, error: `Invalid choice for: ${f.label}` };
          }
        }
      }
      normalized[f.id] = val;
      continue;
    }

    if (!val) {
      normalized[f.id] = "";
      continue;
    }

    if (f.type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        return { ok: false, error: `Invalid email in: ${f.label}` };
      }
    }
    if (f.type === "number") {
      if (!/^-?\d+(\.\d+)?$/.test(val)) {
        return { ok: false, error: `Invalid number in: ${f.label}` };
      }
    }
    if (f.type === "date") {
      if (Number.isNaN(Date.parse(val))) {
        return { ok: false, error: `Invalid date in: ${f.label}` };
      }
    }
    if ((f.type === "dropdown" || f.type === "radio") && f.options?.length) {
      if (!f.options.includes(val)) {
        return { ok: false, error: `Invalid choice for: ${f.label}` };
      }
    }

    normalized[f.id] = val;
  }

  for (const key of Object.keys(normalized)) {
    if (!fields.some((f) => f.id === key)) delete normalized[key];
  }

  return { ok: true, answers: normalized };
}

export function formatRegistrationAnswerValue(value: RegistrationAnswerValue | undefined): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return value.trim() || "—";
}

export function buildRegistrationSummaryLine(
  fields: RegistrationFieldDef[],
  answers: Record<string, RegistrationAnswerValue>
): string {
  const emailField = fields.find((f) => f.type === "email");
  const nameField = fields.find((f) => /name/i.test(f.label) || f.id === "full_name");
  const parts: string[] = [];
  if (nameField) {
    const v = answerAsString(answers[nameField.id] ?? "");
    if (v) parts.push(v);
  }
  if (emailField) {
    const v = answerAsString(answers[emailField.id] ?? "");
    if (v) parts.push(v);
  }
  if (parts.length) return parts.slice(0, 3).join(" · ");
  const first = fields[0];
  const v = first ? answerAsString(answers[first.id] ?? "") : "";
  return v || "Registration";
}

export function registrationRowsForAdmin(
  fields: RegistrationFieldDef[],
  answers: Record<string, RegistrationAnswerValue>
): { label: string; value: string }[] {
  return fields.map((f) => ({
    label: f.label,
    value: formatRegistrationAnswerValue(answers[f.id]),
  }));
}

/** Serialize registrations to CSV (header row + one row per submission). */
export function registrationsToCsv(
  fields: RegistrationFieldDef[],
  rows: { createdAt: string; answers: Record<string, RegistrationAnswerValue> }[]
): string {
  const headers = ["Submitted at", ...fields.map((f) => f.label)];
  const escape = (s: string) => {
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    const cells = [
      new Date(row.createdAt).toISOString(),
      ...fields.map((f) => formatRegistrationAnswerValue(row.answers[f.id])),
    ];
    lines.push(cells.map(escape).join(","));
  }
  return lines.join("\n");
}
