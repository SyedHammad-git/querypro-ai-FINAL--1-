"use client";

import { useMemo, useState } from "react";
import { GitMerge, Plus, X } from "lucide-react";
import { findTableById } from "@/components/schema/SchemaTree";
import { BUILDER_DRAG_MIME } from "./TablePalette";
import type { AggregateFn, BuilderJoin, BuilderSelectedColumn, BuilderTableInstance } from "@/lib/types";
import { cn } from "@/lib/utils";

const AGGREGATES: AggregateFn[] = ["NONE", "COUNT", "SUM", "AVG", "MIN", "MAX"];

export interface SuggestedJoin {
  leftInstanceId: string;
  leftColumnId: string;
  rightInstanceId: string;
  rightColumnId: string;
}

interface QueryCanvasProps {
  tables: BuilderTableInstance[];
  columns: BuilderSelectedColumn[];
  joins: BuilderJoin[];
  onDropTable: (tableId: string) => void;
  onRemoveTable: (instanceId: string) => void;
  onAliasChange: (instanceId: string, alias: string) => void;
  onToggleColumn: (instanceId: string, columnId: string) => void;
  onAggregateChange: (columnEntryId: string, aggregate: AggregateFn) => void;
  onAddSuggestedJoin: (suggestion: SuggestedJoin) => void;
}

export function QueryCanvas({
  tables,
  columns,
  joins,
  onDropTable,
  onRemoveTable,
  onAliasChange,
  onToggleColumn,
  onAggregateChange,
  onAddSuggestedJoin,
}: QueryCanvasProps) {
  const [dragOver, setDragOver] = useState(false);

  // Detect FK relationships between tables currently on the canvas that
  // don't already have an explicit join — offered as one-click suggestions.
  const suggestedJoins = useMemo<SuggestedJoin[]>(() => {
    const suggestions: SuggestedJoin[] = [];
    for (const instance of tables) {
      const table = findTableById(instance.tableId);
      if (!table) continue;
      for (const column of table.columns) {
        if (column.constraint !== "foreign-key" || !column.referencedTable) continue;
        const target = tables.find((t) => t.tableId === column.referencedTable && t.instanceId !== instance.instanceId);
        if (!target) continue;
        const targetTable = findTableById(target.tableId);
        const targetPk = targetTable?.columns.find((c) => c.constraint === "primary-key");
        if (!targetPk) continue;
        const alreadyJoined = joins.some(
          (j) =>
            (j.leftInstanceId === instance.instanceId && j.rightInstanceId === target.instanceId) ||
            (j.rightInstanceId === instance.instanceId && j.leftInstanceId === target.instanceId)
        );
        if (!alreadyJoined) {
          suggestions.push({
            leftInstanceId: instance.instanceId,
            leftColumnId: column.id,
            rightInstanceId: target.instanceId,
            rightColumnId: targetPk.id,
          });
        }
      }
    }
    return suggestions;
  }, [tables, joins]);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const tableId = event.dataTransfer.getData(BUILDER_DRAG_MIME);
    if (tableId) onDropTable(tableId);
  }

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto scrollbar-thin p-lg transition-colors",
        dragOver && "bg-primary/5"
      )}
      aria-label="Query canvas"
    >
      {tables.length === 0 ? (
        <div
          className={cn(
            "h-full min-h-[180px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-sm text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-outline-variant"
          )}
        >
          <Plus className="h-8 w-8 text-outline-variant" aria-hidden="true" />
          <p className="text-body-md text-on-surface-variant max-w-xs">
            Drag a table here from the palette, or click <span className="font-semibold text-primary">Add</span> next to one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          <div className="flex flex-wrap gap-lg">
            {tables.map((instance) => {
              const table = findTableById(instance.tableId);
              if (!table) return null;
              return (
                <div
                  key={instance.instanceId}
                  className="w-72 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elevation-1 overflow-hidden"
                >
                  <div className="p-sm border-b border-border-subtle flex items-center gap-sm bg-surface-container-low">
                    <span className="font-mono text-label-md text-on-surface truncate flex-1">{table.name}</span>
                    <label className="sr-only" htmlFor={`alias-${instance.instanceId}`}>
                      Alias for {table.name}
                    </label>
                    <input
                      id={`alias-${instance.instanceId}`}
                      value={instance.alias}
                      onChange={(e) => onAliasChange(instance.instanceId, e.target.value)}
                      className="w-14 font-mono text-label-sm bg-surface-container-lowest border border-outline-variant rounded px-1.5 py-0.5 text-center"
                      aria-label={`Alias for ${table.name}`}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${table.name} from canvas`}
                      onClick={() => onRemoveTable(instance.instanceId)}
                      className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto scrollbar-thin divide-y divide-border-subtle">
                    {table.columns.map((column) => {
                      const selected = columns.find(
                        (c) => c.instanceId === instance.instanceId && c.columnId === column.id
                      );
                      return (
                        <div key={column.id} className="flex items-center gap-sm px-sm py-1.5">
                          <input
                            type="checkbox"
                            id={`col-${instance.instanceId}-${column.id}`}
                            checked={Boolean(selected)}
                            onChange={() => onToggleColumn(instance.instanceId, column.id)}
                            className="shrink-0 accent-primary h-4 w-4"
                          />
                          <label
                            htmlFor={`col-${instance.instanceId}-${column.id}`}
                            className="flex-1 min-w-0 font-mono text-label-sm text-on-surface-variant truncate cursor-pointer"
                          >
                            {column.name}
                          </label>
                          {selected && (
                            <select
                              value={selected.aggregate}
                              onChange={(e) => onAggregateChange(selected.id, e.target.value as AggregateFn)}
                              aria-label={`Aggregate function for ${column.name}`}
                              className="shrink-0 text-[7.5px] font-mono border border-outline-variant rounded bg-surface-container-lowest px-1 py-0.5"
                            >
                              {AGGREGATES.map((agg) => (
                                <option key={agg} value={agg}>
                                  {agg}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {suggestedJoins.length > 0 && (
            <div className="flex flex-wrap items-center gap-sm">
              <span className="text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                Suggested joins:
              </span>
              {suggestedJoins.map((s, i) => {
                const leftTable = tables.find((t) => t.instanceId === s.leftInstanceId);
                const rightTable = tables.find((t) => t.instanceId === s.rightInstanceId);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onAddSuggestedJoin(s)}
                    className="flex items-center gap-xs px-md py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-label-md hover:bg-primary/10 transition-colors"
                  >
                    <GitMerge className="h-4 w-4" aria-hidden="true" />
                    Join {leftTable?.alias} → {rightTable?.alias}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
