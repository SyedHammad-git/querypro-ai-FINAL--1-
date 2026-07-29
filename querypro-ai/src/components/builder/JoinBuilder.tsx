"use client";

import { GitMerge, Plus, Trash2 } from "lucide-react";
import { findTableById } from "@/components/schema/SchemaTree";
import type { BuilderJoin, BuilderTableInstance, JoinType } from "@/lib/types";

const JOIN_TYPES: JoinType[] = ["INNER", "LEFT", "RIGHT", "FULL"];

interface JoinBuilderProps {
  tables: BuilderTableInstance[];
  joins: BuilderJoin[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<BuilderJoin>) => void;
  onRemove: (id: string) => void;
}

function TableColumnSelect({
  tables,
  instanceId,
  columnId,
  onInstanceChange,
  onColumnChange,
  label,
}: {
  tables: BuilderTableInstance[];
  instanceId: string;
  columnId: string;
  onInstanceChange: (instanceId: string) => void;
  onColumnChange: (columnId: string) => void;
  label: string;
}) {
  const activeTable = tables.find((t) => t.instanceId === instanceId);
  const schemaTable = activeTable ? findTableById(activeTable.tableId) : undefined;

  return (
    <div className="flex items-center gap-1">
      <label className="sr-only">{label} table</label>
      <select
        value={instanceId}
        onChange={(e) => onInstanceChange(e.target.value)}
        className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
      >
        {tables.map((t) => (
          <option key={t.instanceId} value={t.instanceId}>
            {t.alias}
          </option>
        ))}
      </select>
      <span className="text-on-surface-variant">.</span>
      <label className="sr-only">{label} column</label>
      <select
        value={columnId}
        onChange={(e) => onColumnChange(e.target.value)}
        className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
      >
        <option value="">Select column</option>
        {schemaTable?.columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function JoinBuilder({ tables, joins, onAdd, onUpdate, onRemove }: JoinBuilderProps) {
  if (tables.length < 2) {
    return (
      <p className="text-body-md text-on-surface-variant">
        Add at least two tables to the canvas to define a join.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {joins.map((join) => (
        <div key={join.id} className="flex flex-wrap items-center gap-sm bg-surface-container-low p-sm rounded-lg">
          <GitMerge className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <select
            value={join.type}
            onChange={(e) => onUpdate(join.id, { type: e.target.value as JoinType })}
            className="font-mono text-label-sm border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
            aria-label="Join type"
          >
            {JOIN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} JOIN
              </option>
            ))}
          </select>
          <TableColumnSelect
            tables={tables}
            instanceId={join.leftInstanceId}
            columnId={join.leftColumnId}
            onInstanceChange={(instanceId) => onUpdate(join.id, { leftInstanceId: instanceId, leftColumnId: "" })}
            onColumnChange={(columnId) => onUpdate(join.id, { leftColumnId: columnId })}
            label="Left"
          />
          <span className="text-on-surface-variant font-mono text-label-sm">=</span>
          <TableColumnSelect
            tables={tables}
            instanceId={join.rightInstanceId}
            columnId={join.rightColumnId}
            onInstanceChange={(instanceId) => onUpdate(join.id, { rightInstanceId: instanceId, rightColumnId: "" })}
            onColumnChange={(columnId) => onUpdate(join.id, { rightColumnId: columnId })}
            label="Right"
          />
          <button
            type="button"
            onClick={() => onRemove(join.id)}
            aria-label="Remove join"
            className="ml-auto p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-xs self-start px-md py-1.5 rounded-lg border border-dashed border-outline-variant text-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add Join
      </button>
    </div>
  );
}
