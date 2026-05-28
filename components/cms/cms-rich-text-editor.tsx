"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Columns,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Plus,
  Rows,
  Quote,
  Redo2,
  TableCellsMerge,
  Strikethrough,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cmsCredentials } from "@/lib/cms-fetch";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  /** Cloudinary folder for inline image uploads */
  imageFolder?: string;
  enableTables?: boolean;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition",
        active ? "bg-gcs-primary text-white" : "hover:bg-slate-100",
        disabled && "opacity-40"
      )}
    >
      {children}
    </button>
  );
}

export function CmsRichTextEditor({
  value,
  onChange,
  label = "Article body",
  placeholder = "Write the full article. Use the toolbar for headings, lists, links, tables, and inline images.",
  disabled,
  minHeight = "280px",
  imageFolder = "news/body",
  enableTables = true,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableWidthPct, setTableWidthPct] = useState(100);
  const [tableRowHeight, setTableRowHeight] = useState(44);
  const [tableHeaderRow, setTableHeaderRow] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl max-w-full h-auto my-4" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      ...(enableTables
        ? [
            Table.configure({
              resizable: true,
              HTMLAttributes: {
                class: "cms-editor-table",
              },
            }),
            TableRow,
            TableHeader,
            TableCell,
          ]
        : []),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          [
            "cms-rich-editor",
            "prose prose-sm max-w-none px-4 py-3 focus:outline-none min-h-[inherit]",
            "prose-headings:font-semibold prose-p:my-3 prose-ul:my-3 prose-ol:my-3",
            // Table styling (visible contrast vs white page)
            "prose-table:my-6 prose-table:w-full prose-table:table-fixed prose-table:border-separate prose-table:border-spacing-0",
            "prose-table:overflow-hidden prose-table:rounded-xl prose-table:border-2 prose-table:border-slate-300",
            "prose-table:bg-slate-100/90 prose-table:shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)]",
            "prose-th:bg-slate-200 prose-th:px-3 prose-th:py-3 prose-th:text-left prose-th:text-xs prose-th:font-bold prose-th:uppercase prose-th:tracking-wide prose-th:text-slate-800 prose-th:border-b prose-th:border-slate-300",
            "prose-td:bg-slate-50 prose-td:px-3 prose-td:py-3 prose-td:text-sm prose-td:text-slate-800 prose-td:border-b prose-td:border-slate-200 last:prose-td:border-b-0",
            // Stronger zebra striping (non-white)
            "prose-tr:odd:prose-td:bg-slate-100/70",
            // Allow controlling row height via CSS variable on the table element.
            "prose-th:h-[var(--cms-row-h)] prose-td:h-[var(--cms-row-h)]",
          ].join(" "),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!tableMenuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setTableMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (tableMenuRef.current && !tableMenuRef.current.contains(target)) {
        setTableMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [tableMenuOpen]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", imageFolder);
      try {
        const res = await fetch("/api/cms/upload", { method: "POST", body: fd, ...cmsCredentials });
        const body = (await res.json().catch(() => null)) as { url?: string } | null;
        if (res.ok && body?.url) {
          editor.chain().focus().setImage({ src: body.url, alt: file.name }).run();
        }
      } finally {
        setUploading(false);
      }
    },
    [editor, imageFolder]
  );

  function clampInt(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, Math.round(n)));
  }

  function insertConfiguredTable() {
    if (!editor) return;
    const rows = clampInt(tableRows, 1, 20);
    const cols = clampInt(tableCols, 1, 12);
    const width = clampInt(tableWidthPct, 30, 100);
    const rowH = clampInt(tableRowHeight, 28, 84);

    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: tableHeaderRow })
      .run();

    // Apply styling/constraints on the inserted table node.
    editor.commands.updateAttributes("table", {
      style: `width:${width}%;--cms-row-h:${rowH}px;`,
    });

    setTableMenuOpen(false);
  }

  if (!editor) {
    return (
      <div className="flex items-center gap-2 text-sm text-gcs-muted-text">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading editor…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
          disabled && "opacity-60"
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/80 px-2 py-1.5">
          <ToolbarButton
            title="Bold"
            disabled={disabled}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            disabled={disabled}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            disabled={disabled}
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            disabled={disabled}
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <ToolbarButton
            title="Heading"
            disabled={disabled}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <span className="text-xs font-bold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            title="Subheading"
            disabled={disabled}
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <span className="text-xs font-bold">H3</span>
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <ToolbarButton
            title="Bullet list"
            disabled={disabled}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            disabled={disabled}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Quote"
            disabled={disabled}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <ToolbarButton
            title="Align left"
            disabled={disabled}
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            disabled={disabled}
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            disabled={disabled}
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <ToolbarButton
            title="Add link"
            disabled={disabled}
            active={editor.isActive("link")}
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link URL", prev ?? "https://");
              if (url === null) return;
              if (!url) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Insert image"
            disabled={disabled || uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </ToolbarButton>
          {enableTables ? (
            <>
              <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
              <div className="relative" ref={tableMenuRef}>
                <ToolbarButton
                  title="Table options"
                  disabled={disabled}
                  active={tableMenuOpen || editor.isActive("table")}
                  onClick={() => setTableMenuOpen((o) => !o)}
                >
                  <Table2 className="h-4 w-4" />
                </ToolbarButton>

                {tableMenuOpen ? (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Insert table</p>

                    <div className="mt-3 grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">Rows</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              onClick={() => setTableRows((n) => clampInt(n - 1, 1, 20))}
                            >
                              <Minus className="h-4 w-4" aria-hidden />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={tableRows}
                              onChange={(e) => setTableRows(clampInt(Number(e.target.value), 1, 20))}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                            />
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              onClick={() => setTableRows((n) => clampInt(n + 1, 1, 20))}
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">Columns</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              onClick={() => setTableCols((n) => clampInt(n - 1, 1, 12))}
                            >
                              <Minus className="h-4 w-4" aria-hidden />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={tableCols}
                              onChange={(e) => setTableCols(clampInt(Number(e.target.value), 1, 12))}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                            />
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              onClick={() => setTableCols((n) => clampInt(n + 1, 1, 12))}
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">Width (%)</span>
                          <input
                            type="number"
                            min={30}
                            max={100}
                            value={tableWidthPct}
                            onChange={(e) => setTableWidthPct(clampInt(Number(e.target.value), 30, 100))}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">Row height (px)</span>
                          <input
                            type="number"
                            min={28}
                            max={84}
                            value={tableRowHeight}
                            onChange={(e) => setTableRowHeight(clampInt(Number(e.target.value), 28, 84))}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={tableHeaderRow}
                          onChange={(e) => setTableHeaderRow(e.target.checked)}
                        />
                        Header row
                      </label>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => setTableMenuOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl bg-gcs-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gcs-primary-hover"
                          onClick={insertConfiguredTable}
                        >
                          Insert table
                        </button>
                      </div>

                      <p className="text-xs text-slate-500">
                        After inserting, you can resize columns by dragging their edges.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              <ToolbarButton
                title="Add column after"
                disabled={disabled || !editor.can().addColumnAfter()}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <Columns className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Add row after"
                disabled={disabled || !editor.can().addRowAfter()}
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <Rows className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Toggle header row"
                disabled={disabled || !editor.can().toggleHeaderRow()}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              >
                <TableCellsMerge className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Delete table"
                disabled={disabled || !editor.can().deleteTable()}
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <Trash2 className="h-4 w-4" />
              </ToolbarButton>
            </>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
              e.target.value = "";
            }}
          />
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <ToolbarButton title="Undo" disabled={disabled} onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo" disabled={disabled} onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div style={{ minHeight }} className="bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>
      <p className="text-xs text-gcs-muted-text">
        Format text, add lists, links, tables, and images. Images upload when you insert them in the editor.
      </p>

      {/* Table styling handled in app/globals.css via `.cms-rich-editor` */}
    </div>
  );
}
