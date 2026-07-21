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
  "file",
  "section",
  "paragraph",
] as const;

export type RegistrationFieldType = (typeof REGISTRATION_FIELD_TYPE_VALUES)[number];

/** Human labels for CMS type picker. */
export const REGISTRATION_FIELD_TYPE_OPTIONS: { value: RegistrationFieldType; label: string }[] = [
  { value: "short_text", label: "Short answer" },
  { value: "long_text", label: "Paragraph answer" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Multiple choice (single)" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "multi_select", label: "Select multiple" },
  { value: "file", label: "File upload" },
  { value: "section", label: "Section heading" },
  { value: "paragraph", label: "Descriptive text" },
];

const LEGACY_TYPE_MAP: Record<string, RegistrationFieldType> = {
  text: "short_text",
  textarea: "long_text",
  select: "dropdown",
};

export const DEFAULT_FILE_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";
export const REGISTRATION_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function isImageExtension(extOrName: string): boolean {
  const lower = extOrName.toLowerCase();
  if (IMAGE_EXTS.has(lower)) return true;
  return [...IMAGE_EXTS].some((ext) => lower.endsWith(ext));
}

/** True when a stored file answer is an image (by mime or filename). */
export function isImageFileAnswer(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as { url?: unknown; fileName?: unknown; mime?: unknown };
  if (typeof v.url !== "string" || typeof v.fileName !== "string") return false;
  if (typeof v.mime === "string" && v.mime.startsWith("image/")) return true;
  return isImageExtension(v.fileName);
}

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

/** Section / paragraph — display only, no answers collected. */
export function fieldTypeIsLayout(type: RegistrationFieldType): boolean {
  return type === "section" || type === "paragraph";
}

export function fieldTypeIsFile(type: RegistrationFieldType): boolean {
  return type === "file";
}

export function fieldTypeIsAnswerable(type: RegistrationFieldType): boolean {
  return !fieldTypeIsLayout(type);
}

/** Normalize comma-separated extensions (e.g. `.pdf, doc, DOCX` → `.pdf,.doc,.docx`). */
export function normalizeFileAccept(raw: string | null | undefined): string {
  if (!raw?.trim()) return DEFAULT_FILE_ACCEPT;
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => (s.startsWith(".") ? s : `.${s}`));
  return parts.length ? [...new Set(parts)].join(",") : DEFAULT_FILE_ACCEPT;
}

export function parseFileAcceptList(accept: string | null | undefined): string[] {
  return normalizeFileAccept(accept)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function fileMatchesAccept(fileName: string, accept: string | null | undefined): boolean {
  const exts = parseFileAcceptList(accept);
  const lower = fileName.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

/**
 * HTML `accept` attribute: extensions + MIME types so OS pickers show images/docs correctly.
 */
export function toHtmlFileAccept(accept: string | null | undefined): string {
  const exts = parseFileAcceptList(accept);
  const parts = new Set<string>(exts);
  let hasImage = false;
  for (const ext of exts) {
    const mime = EXT_TO_MIME[ext];
    if (mime) parts.add(mime);
    if (IMAGE_EXTS.has(ext)) hasImage = true;
  }
  if (hasImage) parts.add("image/*");
  return [...parts].join(",");
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
  placeholder: z.string().max(200).optional(),
  /** Comma-separated extensions for file fields, e.g. `.pdf,.doc,.docx`. */
  accept: z.string().max(200).optional(),
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
  helpText: z.string().max(500).optional(),
  placeholder: z.string().max(200).optional(),
  accept: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const registrationFormFieldsSchema = z.array(registrationFieldDefSchema).max(40);

export type RegistrationFileAnswer = {
  url: string;
  fileName: string;
  publicId?: string;
  mime?: string;
  bytes?: number;
};

export type RegistrationAnswerValue = string | string[] | RegistrationFileAnswer;

export function isRegistrationFileAnswer(value: unknown): value is RegistrationFileAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.url === "string" && v.url.length > 0 && typeof v.fileName === "string";
}

export function parseRegistrationFileAnswer(value: unknown): RegistrationFileAnswer | null {
  if (isRegistrationFileAnswer(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return isRegistrationFileAnswer(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseRegistrationFormFields(raw: Prisma.JsonValue | null | undefined): RegistrationFieldDef[] {
  if (raw == null || !Array.isArray(raw)) return [];
  const parsed: RegistrationFieldDef[] = [];
  for (const item of raw) {
    const row = registrationFieldDefParseSchema.safeParse(item);
    if (!row.success) continue;
    const type = normalizeRegistrationFieldType(row.data.type);
    const description = row.data.description?.trim() || row.data.helpText?.trim() || undefined;
    parsed.push({
      id: row.data.id,
      label: row.data.label,
      type,
      required: fieldTypeIsLayout(type) ? false : row.data.required,
      options: fieldTypeNeedsOptions(type) ? row.data.options : undefined,
      description,
      placeholder: row.data.placeholder?.trim() || undefined,
      accept: fieldTypeIsFile(type) ? normalizeFileAccept(row.data.accept) : undefined,
      sortOrder: row.data.sortOrder,
    });
  }
  return parsed.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function hasRegistrationForm(raw: Prisma.JsonValue | null | undefined): boolean {
  return parseRegistrationFormFields(raw).some((f) => fieldTypeIsAnswerable(f.type));
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
        required: fieldTypeIsLayout(type) ? false : Boolean(f.required),
        description: f.description?.trim() || undefined,
        placeholder: f.placeholder?.trim() || undefined,
        accept: fieldTypeIsFile(type) ? normalizeFileAccept(f.accept) : undefined,
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
  if (isRegistrationFileAnswer(value)) {
    return {
      url: value.url.trim(),
      fileName: value.fileName.trim() || "file",
      publicId: value.publicId?.trim() || undefined,
      mime: value.mime?.trim() || undefined,
      bytes: typeof value.bytes === "number" ? value.bytes : undefined,
    };
  }
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
  const file = parseRegistrationFileAnswer(value);
  if (file) return file.fileName || file.url;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value.trim();
  return "";
}

export function validateRegistrationAnswers(
  fields: RegistrationFieldDef[],
  answers: unknown
): { ok: true; answers: Record<string, RegistrationAnswerValue> } | { ok: false; error: string } {
  const normalized = normalizeAnswers(answers);
  const answerable = fields.filter((f) => fieldTypeIsAnswerable(f.type));

  for (const f of answerable) {
    if (fieldTypeIsFile(f.type)) {
      const file = parseRegistrationFileAnswer(normalized[f.id]);
      if (f.required && !file) {
        return { ok: false, error: `Missing required field: ${f.label}` };
      }
      if (!file) {
        delete normalized[f.id];
        continue;
      }
      if (!/^https?:\/\//i.test(file.url)) {
        return { ok: false, error: `Invalid file upload for: ${f.label}` };
      }
      if (!fileMatchesAccept(file.fileName, f.accept)) {
        return {
          ok: false,
          error: `File type not allowed for ${f.label}. Allowed: ${normalizeFileAccept(f.accept)}`,
        };
      }
      normalized[f.id] = file;
      continue;
    }

    const raw = normalized[f.id] ?? (fieldTypeAcceptsMultipleValues(f.type) ? [] : "");
    if (isRegistrationFileAnswer(raw)) {
      return { ok: false, error: `Invalid answer for: ${f.label}` };
    }
    const val = fieldTypeAcceptsMultipleValues(f.type)
      ? Array.isArray(raw)
        ? raw
        : raw
          ? [String(raw).trim()]
          : []
      : (Array.isArray(raw) ? (raw[0] ?? "") : typeof raw === "string" ? raw : "").trim();

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
    if (!answerable.some((f) => f.id === key)) delete normalized[key];
  }

  return { ok: true, answers: normalized };
}

export function formatRegistrationAnswerValue(value: RegistrationAnswerValue | undefined): string {
  if (value == null) return "—";
  const file = parseRegistrationFileAnswer(value);
  if (file) return file.fileName || file.url;
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "string") return value.trim() || "—";
  return "—";
}

export type RegistrationAdminRow = {
  label: string;
  value: string;
  href?: string;
};

export function buildRegistrationSummaryLine(
  fields: RegistrationFieldDef[],
  answers: Record<string, RegistrationAnswerValue>
): string {
  const answerable = fields.filter((f) => fieldTypeIsAnswerable(f.type) && !fieldTypeIsFile(f.type));
  const emailField = answerable.find((f) => f.type === "email");
  const nameField = answerable.find((f) => /name/i.test(f.label) || f.id === "full_name");
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
  const first = answerable[0];
  const v = first ? answerAsString(answers[first.id] ?? "") : "";
  return v || "Registration";
}

export function registrationRowsForAdmin(
  fields: RegistrationFieldDef[],
  answers: Record<string, RegistrationAnswerValue>
): RegistrationAdminRow[] {
  return fields
    .filter((f) => fieldTypeIsAnswerable(f.type))
    .map((f) => {
      const raw = answers[f.id];
      const file = parseRegistrationFileAnswer(raw);
      if (file) {
        return {
          label: f.label,
          value: file.fileName || "Download file",
          href: file.url,
        };
      }
      return {
        label: f.label,
        value: formatRegistrationAnswerValue(raw),
      };
    });
}

/** Serialize registrations to CSV (header row + one row per submission). */
export function registrationsToCsv(
  fields: RegistrationFieldDef[],
  rows: { createdAt: string; answers: Record<string, RegistrationAnswerValue> }[]
): string {
  const exportFields = fields.filter((f) => fieldTypeIsAnswerable(f.type));
  const headers = ["Submitted at", ...exportFields.map((f) => f.label)];
  const escape = (s: string) => {
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    const cells = [
      new Date(row.createdAt).toISOString(),
      ...exportFields.map((f) => {
        const file = parseRegistrationFileAnswer(row.answers[f.id]);
        if (file) return file.url ? `${file.fileName} (${file.url})` : file.fileName;
        return formatRegistrationAnswerValue(row.answers[f.id]);
      }),
    ];
    lines.push(cells.map(escape).join(","));
  }
  return lines.join("\n");
}
