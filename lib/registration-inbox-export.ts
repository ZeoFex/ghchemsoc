/** Shared export helpers for the CMS registration inbox (multi-event list). */

export type InboxExportLine = { label: string; value: string; href?: string };

export type InboxExportRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  createdAt: string;
  read: boolean;
  summaryLine: string | null;
  lines: InboxExportLine[];
};

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellValue(line: InboxExportLine | undefined): string {
  if (!line) return "";
  if (line.href) {
    const name = line.value?.trim() || "Download";
    return `${name} (${line.href})`;
  }
  const v = line.value?.trim() ?? "";
  return v === "—" ? "" : v;
}

function collectAnswerLabels(rows: InboxExportRow[]): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const line of row.lines) {
      if (!seen.has(line.label)) {
        seen.add(line.label);
        labels.push(line.label);
      }
    }
  }
  return labels;
}

export function buildInboxExportTable(rows: InboxExportRow[]): {
  headers: string[];
  data: string[][];
} {
  const labels = collectAnswerLabels(rows);
  const headers = ["Submitted at", "Event", "Summary", "Status", ...labels];
  const data = rows.map((row) => {
    const byLabel = new Map(row.lines.map((line) => [line.label, line]));
    return [
      new Date(row.createdAt).toISOString(),
      row.eventTitle,
      row.summaryLine ?? "",
      row.read ? "Read" : "Unread",
      ...labels.map((label) => cellValue(byLabel.get(label))),
    ];
  });
  return { headers, data };
}

export function registrationInboxToCsv(rows: InboxExportRow[]): string {
  const { headers, data } = buildInboxExportTable(rows);
  const lines = [headers.map(escapeCsv).join(",")];
  for (const cells of data) {
    lines.push(cells.map(escapeCsv).join(","));
  }
  // BOM helps Excel open UTF-8 CSV correctly
  return `\uFEFF${lines.join("\n")}`;
}

export function registrationInboxToJson(rows: InboxExportRow[]): string {
  const payload = rows.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    submittedAt: row.createdAt,
    summary: row.summaryLine,
    status: row.read ? "read" : "unread",
    answers: Object.fromEntries(
      row.lines.map((line) => [
        line.label,
        line.href ? { fileName: line.value, url: line.href } : line.value,
      ])
    ),
  }));
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/** Excel-compatible SpreadsheetML (.xls) — opens in Excel / LibreOffice without extra deps. */
export function registrationInboxToExcelXml(rows: InboxExportRow[]): string {
  const { headers, data } = buildInboxExportTable(rows);
  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join("");
  const bodyRows = data
    .map((cells) => {
      const tds = cells
        .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`)
        .join("");
      return `<Row>${tds}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Registrations">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>
`;
}

export function downloadTextFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function inboxExportFilename(ext: "csv" | "json" | "xls", unreadOnly: boolean): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = unreadOnly ? "unread" : "all";
  return `event-registrations-${scope}-${stamp}.${ext}`;
}
