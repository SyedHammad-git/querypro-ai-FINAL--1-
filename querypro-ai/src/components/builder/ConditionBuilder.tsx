"use client";

import { Plus, Trash2 } from "lucide-react";
import { findTableById } from "@/components/schema/SchemaTree";
import type { BuilderCondition, BuilderTableInstance, ConditionOperator, LogicalConnector } from "@/lib/types";

const OPERATORS: ConditionOperator[] = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "IN", "IS NULL", "IS NOT NULL"];
const CONNECTORS: LogicalConnector[] = ["AND", "OR"];

interface ConditionBuilderProps {
  tables: BuilderTableInstance[];
  conditions: BuilderCondition[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<BuilderCondition>) => void;
  onRemove: (id: string) => void;
  emptyLabel: string;
  addLabel: string;
  keyword: "WHERE" | "HAVING";
}

export function ConditionBuilder({
  tables,
  conditions,
  onAdd,
  onUpdate,
  onRemove,
  emptyLabel,
  addLabel,
  keyword,
}: ConditionBuilderProps) {
  if (tables.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-sm">
      {conditions.map((cond, index) => {
        const activeTable = tables.find((t) => t.instanceId === cond.instanceId) ?? tables[0];
        const schemaTable = activeTable ? findTableById(activeTable.tableId) : undefined;
        const needsValue = cond.operator !== "IS NULL" && cond.operator !== "IS NOT NULL";

        return (
          <div key={cond.id} className="flex flex-wrap items-center gap-sm bg-surface-container-low p-sm rounded-lg">
            {index > 0 ? (
              <select
                value={cond.connector}
                onChange={(e) => onUpdate(cond.id, { connector: e.target.value as LogicalConnector })}
                aria-label="Logical connector"
                className="font-mono text-label-sm font-bold border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5 text-primary"
              >
                {CONNECTORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-label-sm text-on-surface-variant w-14 text-center shrink-0">
                {keyword}
              </span>
            )}

            <select
              value={activeTable?.instanceId ?? ""}
              onChange={(e) => onUpdate(cond.id, { instanceId: e.target.value, columnId: "" })}
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
              value={cond.columnId}
              onChange={(e) => onUpdate(cond.id, { columnId: e.target.value })}
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

            <select
              value={cond.operator}
              onChange={(e) => onUpdate(cond.id, { operator: e.target.value as ConditionOperator })}
              aria-label="Operator"
              className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            {needsValue && (
              <input
                value={cond.value}
                onChange={(e) => onUpdate(cond.id, { value: e.target.value })}
                placeholder="value"
                aria-label="Value"
                className="flex-1 min-w-[75px] font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
              />
            )}

            <button
              type="button"
              onClick={() => onRemove(cond.id)}
              aria-label="Remove condition"
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
        {addLabel}
      </button>
    </div>
  );
}
