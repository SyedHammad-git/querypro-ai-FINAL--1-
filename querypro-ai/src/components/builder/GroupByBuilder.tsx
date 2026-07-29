"use client";

import { Plus, X } from "lucide-react";
import { findTableById } from "@/components/schema/SchemaTree";
import type { BuilderGroupByField, BuilderTableInstance } from "@/lib/types";

interface GroupByBuilderProps {
  tables: BuilderTableInstance[];
  fields: BuilderGroupByField[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<BuilderGroupByField>) => void;
  onRemove: (id: string) => void;
}

export function GroupByBuilder({ tables, fields, onAdd, onUpdate, onRemove }: GroupByBuilderProps) {
  if (tables.length === 0) {
    return <p className="text-body-md text-on-surface-variant">Add a table before grouping.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-sm">
      {fields.map((field) => {
        const activeTable = tables.find((t) => t.instanceId === field.instanceId) ?? tables[0];
        const schemaTable = activeTable ? findTableById(activeTable.tableId) : undefined;
        return (
          <div key={field.id} className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
            <select
              value={activeTable?.instanceId ?? ""}
              onChange={(e) => onUpdate(field.id, { instanceId: e.target.value, columnId: "" })}
              aria-label="Table"
              className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1"
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
              className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1"
            >
              <option value="">column</option>
              {schemaTable?.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove(field.id)}
              aria-label="Remove group by field"
              className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-xs px-md py-1.5 rounded-lg border border-dashed border-outline-variant text-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add field
      </button>
    </div>
  );
}
