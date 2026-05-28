"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type ColumnResizeMode,
  type ColumnSizingState,
  type Row as TableRow,
  useReactTable,
} from "@tanstack/react-table";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Id = string;

function DragHandle({
  attributes,
  listeners,
}: {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners?: unknown;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
      aria-label="Drag to reorder"
      {...attributes}
      {...(listeners as React.HTMLAttributes<HTMLElement> | undefined)}
    >
      <GripVertical className="h-4 w-4" aria-hidden />
    </button>
  );
}

function SortableBodyRow<TData>({
  row,
  renderCells,
}: {
  row: TableRow<TData>;
  renderCells: () => React.ReactNode;
}) {
  const id = String(row.id);
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      className={cn(
        "border-b border-slate-200/80 last:border-b-0",
        isDragging && "bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)]"
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-dragging={isDragging ? "true" : "false"}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === "__drag") {
          return (
            <td
              key={cell.id}
              className="w-[56px] px-3 py-3 align-middle"
              style={{ width: cell.column.getSize() }}
            >
              <DragHandle attributes={attributes} listeners={listeners} />
            </td>
          );
        }

        return (
          <td key={cell.id} className="px-3 py-3 align-middle text-sm text-slate-700" style={{ width: cell.column.getSize() }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
      {renderCells()}
    </tr>
  );
}

export type CmsDataTableProps<TData extends { id: string }> = {
  rows: TData[];
  columns: ColumnDef<TData, unknown>[];
  onReorder?: (nextRows: TData[]) => void | Promise<void>;
  className?: string;
  columnResizeMode?: ColumnResizeMode;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  emptyLabel?: string;
};

export function CmsDataTable<TData extends { id: string }>({
  rows,
  columns,
  onReorder,
  className,
  columnResizeMode = "onChange",
  columnSizing,
  onColumnSizingChange,
  emptyLabel = "No items yet.",
}: CmsDataTableProps<TData>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    state: {
      columnSizing,
    },
    onColumnSizingChange,
  });

  function handleDragEnd(e: DragEndEvent) {
    if (!onReorder) return;
    const activeId = e.active?.id ? String(e.active.id) : null;
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!activeId || !overId || activeId === overId) return;

    const oldIndex = rows.findIndex((r) => r.id === activeId);
    const newIndex = rows.findIndex((r) => r.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextRows = arrayMove(rows, oldIndex, newIndex);
    void onReorder(nextRows);
  }

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center", className)}>
        <p className="text-sm font-medium text-slate-700">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 shadow-sm", className)}>
      <div className="overflow-auto rounded-xl bg-white">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <table className="min-w-full table-fixed border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-200/80">
                    {hg.headers.map((header) => {
                      const canResize = header.column.getCanResize();
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "relative select-none whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                            header.column.id === "__drag" && "w-[56px]"
                          )}
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {canResize ? (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                "absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none",
                                "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-slate-200"
                              )}
                              aria-hidden
                            />
                          ) : null}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <SortableBodyRow
                    key={row.id}
                    row={row}
                    renderCells={() => null}
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
      <p className="px-2 pt-2 text-xs text-slate-500">
        Drag the handle to reorder. Drag a column edge to resize.
      </p>
    </div>
  );
}

