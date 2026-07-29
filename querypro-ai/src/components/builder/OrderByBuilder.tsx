"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { findTableById } from "@/components/schema/SchemaTree";
import type { BuilderOrderBy, BuilderTableInstance, SortDirection } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderByBuilderProps {
  tables: BuilderTableInstance[];
  fields: BuilderOrderBy[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<BuilderOrderBy>) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function OrderByBuilder({ tables, fields, onAdd, onUpdate, onRemove, onReorder }: OrderByBuilderProps) {
  if (tables.length === 0) {
    return <p className="text-body-md text-on-surface-variant">Add a table before sorting.</p>;
  }

  return (
    <div className="flex flex-col gap-sm">
      {fields.map((field, index) => {
        const activeTable = tables.find((t) => t.instanceId === field.instanceId) ?? tables[0];
        const schemaTable = activeTable ? findTableById(activeTable.tableId) : undefined;
        return (
          <div key={field.id} className="flex items-center gap-sm bg-surface-container-low p-sm rounded-lg">
            <span className="font-mono text-label-sm text-outline w-5 text-center shrink-0">{index + 1}</span>
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onReorder(index, index - 1)}
                aria-label="Move up"
                className="p-0.5 text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={index === fields.length - 1}
                onClick={() => onReorder(index, index + 1)}
                aria-label="Move down"
                className="p-0.5 text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <select
              value={activeTable?.instanceId ?? ""}
              onChange={(e) => onUpdate(field.id, { instanceId: e.target.value, columnId: "" })}
              aria-label="Table"
              className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
            >
              {tables.map((t) => (
                <option key={t.instanceId} value={t.instanceId}>
                  {t.alias}
                </option>
              ))}
            </select>
            <span className="text-on-surface-variant">.</span>
            <select
              value={field.columnId}
              onChange={(e) => onUpdate(field.id, { columnId: e.target.value })}
              aria-label="Column"
              className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
            >
              <option value="">column</option>
              {schemaTable?.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg border border-outline-variant overflow-hidden">
              {(["ASC", "DESC"] as SortDirection[]).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => onUpdate(field.id, { direction: dir })}
                  className={cn(
                    "px-2 py-1.5 text-label-sm font-mono transition-colors",
                    field.direction === dir
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onRemove(field.id)}
              aria-label="Remove sort field"
              className="ml-auto p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-xs self-start px-md py-1.5 rounded-lg border border-dashed border-outline-variant text-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add sort field
      </button>
    </div>
  );
}
