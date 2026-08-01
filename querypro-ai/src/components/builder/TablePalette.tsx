"use client";

import { useEffect, useState } from "react";
import { Eye, FunctionSquare, GripVertical, Search, Table, TableProperties } from "lucide-react";
import { SCHEMA_GROUPS } from "@/lib/mock-data";
import type { SchemaTable } from "@/lib/types";
import { useSqlStore } from "@/lib/useSqlStore";

export const BUILDER_DRAG_MIME = "application/x-querypro-table-id";

const KIND_ICON: Record<SchemaTable["kind"], typeof TableProperties> = {
  table: TableProperties,
  view: Eye,
  procedure: FunctionSquare,
};

interface TablePaletteProps {
  onAddTable: (table: SchemaTable) => void;
  addedTableIds: string[];
}

/**
 * Source list for the builder canvas. Cards are natively draggable
 * (HTML5 Drag and Drop API — no extra dependency) and also support a plain
 * click-to-add for keyboard/touch users, since drag-and-drop alone isn't
 * reliably accessible.
 */
export function TablePalette({ onAddTable, addedTableIds }: TablePaletteProps) {
  const [query, setQuery] = useState("");
  const refreshSchema = useSqlStore((state) => state.refreshSchema);
  const schemaGroups = useSqlStore((state) => state.schemaGroups);
  const schemaLoading = useSqlStore((state) => state.schemaLoading);

  useEffect(() => {
    void refreshSchema();
  }, []);

  const displayGroups = schemaLoading ? SCHEMA_GROUPS : schemaGroups;
  const allTables = displayGroups.flatMap((g) => g.tables).filter(
    (t) => t.kind === "table" && t.columns.length > 0
  );
  const filtered = query.trim()
    ? allTables.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : allTables;

  function handleDragStart(event: React.DragEvent, tableId: string) {
    event.dataTransfer.setData(BUILDER_DRAG_MIME, tableId);
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <section className="w-64 shrink-0 bg-surface-container-lowest border-r border-border-subtle flex flex-col" aria-label="Table palette">
      <div className="p-md border-b border-border-subtle">
        <div className="flex items-center justify-between mb-sm">
          <h2 className="font-heading text-headline-sm text-on-surface flex items-center gap-xs">
            <Table className="h-[13.5px] w-[13.5px] text-secondary" aria-hidden="true" />
            Tables
          </h2>
          <span className="font-mono text-label-sm text-on-surface-variant">{filtered.length}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-[13.5px] w-[13.5px] text-outline" aria-hidden="true" />
          <label htmlFor="builder-table-search" className="sr-only">Search tables</label>
          <input
            id="builder-table-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables…"
            className="w-full pl-9 pr-md py-1.5 text-sm border border-outline-variant rounded-md bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-sm space-y-1">
        {filtered.map((table) => {
          const Icon = KIND_ICON[table.kind];
          const isAdded = addedTableIds.includes(table.id);
          return (
            <div
              key={table.id}
              draggable
              onDragStart={(e) => handleDragStart(e, table.id)}
              className="group flex items-center gap-sm p-sm rounded-lg border border-transparent hover:border-outline-variant hover:bg-surface-container-low cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical className="h-4 w-4 text-outline-variant shrink-0" aria-hidden="true" />
              <Icon className="h-[13.5px] w-[13.5px] text-primary shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-label-md text-on-surface truncate">{table.name}</div>
                <div className="text-label-sm text-on-surface-variant">{table.columns.length} columns</div>
              </div>
              <button
                type="button"
                onClick={() => onAddTable(table)}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 text-label-sm text-primary font-semibold px-2 py-1 rounded hover:bg-primary/10 transition-opacity"
              >
                {isAdded ? "Add again" : "Add"}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-lg">No tables match.</p>
        )}
      </div>

      <div className="p-md border-t border-border-subtle text-label-sm text-on-surface-variant">
        Drag a table onto the canvas, or click <span className="font-semibold text-primary">Add</span>.
      </div>
    </section>
  );
}
