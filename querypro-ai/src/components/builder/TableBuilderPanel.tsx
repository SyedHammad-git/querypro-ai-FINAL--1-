"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { CodeBlock } from "@/components/sql/CodeBlock";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";

const OPERATIONS = ["CREATE", "SELECT", "INSERT", "UPDATE", "DELETE"] as const;
type Operation = (typeof OPERATIONS)[number];

const DATA_TYPES = ["INTEGER", "VARCHAR", "BOOLEAN", "DATE", "TEXT", "DECIMAL"] as const;

interface ColumnDef {
  id: string;
  name: string;
  dataType: (typeof DATA_TYPES)[number];
  size: string;
  primaryKey: boolean;
  autoIncrement: boolean;
  notNull: boolean;
  unique: boolean;
}

interface FieldDef {
  id: string;
  name: string;
  value: string;
}


/** Generates a collision-resistant ID without relying on module-level mutable state. */
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function newColumn(): ColumnDef {
  return {
    id: nextId("col"),
    name: "",
    dataType: "INTEGER",
    size: "255",
    primaryKey: false,
    autoIncrement: false,
    notNull: false,
    unique: false,
  };
}

function newField(): FieldDef {
  return { id: nextId("field"), name: "", value: "" };
}

function quoteIfNeeded(value: string) {
  if (!value) return "''";
  const isNumeric = /^-?\d+(\.\d+)?$/.test(value.trim());
  return isNumeric ? value.trim() : `'${value.replace(/'/g, "''")}'`;
}

function buildSql(op: Operation, tableName: string, columns: ColumnDef[], fields: FieldDef[], where: string) {
  const table = tableName.trim() || "table_name";

  if (op === "CREATE") {
    const cols = columns.length ? columns : [{ ...newColumn(), name: "column_name" }];
    const lines = cols.map((col) => {
      const type = col.size && ["VARCHAR", "DECIMAL"].includes(col.dataType) ? `${col.dataType}(${col.size})` : col.dataType;
      const constraints = [
        col.primaryKey && "PRIMARY KEY",
        col.autoIncrement && "AUTO_INCREMENT",
        col.notNull && "NOT NULL",
        col.unique && "UNIQUE",
      ]
        .filter(Boolean)
        .join(" ");
      const name = col.name.trim() || "column_name";
      return `  ${name} ${type}${constraints ? ` ${constraints}` : ""}`;
    });
    return `CREATE TABLE ${table} (\n${lines.join(",\n")}\n);`;
  }

  if (op === "SELECT") {
    const cols = fields.filter((f) => f.name.trim()).map((f) => f.name.trim());
    return `SELECT ${cols.length ? cols.join(", ") : "*"}\nFROM ${table}${where.trim() ? `\nWHERE ${where.trim()}` : ""};`;
  }

  if (op === "INSERT") {
    const named = fields.filter((f) => f.name.trim());
    const names = named.map((f) => f.name.trim()).join(", ") || "column1, column2";
    const values = named.map((f) => quoteIfNeeded(f.value)).join(", ") || "value1, value2";
    return `INSERT INTO ${table} (${names})\nVALUES (${values});`;
  }

  if (op === "UPDATE") {
    const named = fields.filter((f) => f.name.trim());
    const sets = named.map((f) => `${f.name.trim()} = ${quoteIfNeeded(f.value)}`).join(",\n  ") || "column = value";
    return `UPDATE ${table}\nSET ${sets}${where.trim() ? `\nWHERE ${where.trim()}` : ""};`;
  }

  // DELETE
  return `DELETE FROM ${table}${where.trim() ? `\nWHERE ${where.trim()}` : ""};`;
}

const FIELD_LABEL: Record<Operation, string> = {
  CREATE: "",
  SELECT: "Columns to select",
  INSERT: "Column values",
  UPDATE: "Columns to set",
  DELETE: "",
};

export function TableBuilderPanel() {
  const [operation, setOperation] = useState<Operation>("CREATE");
  const [tableName, setTableName] = useState("products");
  const [columns, setColumns] = useState<ColumnDef[]>([newColumn()]);
  const [fields, setFields] = useState<FieldDef[]>([newField()]);
  const [where, setWhere] = useState("");
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState<{ time: string; rows: string } | null>(null);

  const sql = useMemo(
    () => buildSql(operation, tableName, columns, fields, where),
    [operation, tableName, columns, fields, where]
  );

  function updateColumn(id: string, patch: Partial<ColumnDef>) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updateField(id: string, patch: Partial<FieldDef>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function handleRun() {
    setRunning(true);
    setMetrics(null);
    setTimeout(() => {
      const ms = Math.round(8 + Math.random() * 40);
      const rows =
        operation === "SELECT" ? Math.round(Math.random() * 40) : operation === "CREATE" ? 0 : Math.round(1 + Math.random() * 5);
      setMetrics({ time: `${ms} ms`, rows: String(rows) });
      setRunning(false);
    }, 700);
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Operation form */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-lg flex flex-col gap-lg min-w-0">
        <div className="flex flex-wrap gap-1 p-1 bg-surface-container-low rounded-lg w-fit" role="tablist" aria-label="SQL operation">
          {OPERATIONS.map((op) => (
            <button
              key={op}
              type="button"
              role="tab"
              aria-selected={operation === op}
              onClick={() => setOperation(op)}
              className={cn(
                "px-lg py-1.5 rounded-md text-label-md font-semibold transition-colors",
                operation === op
                  ? "bg-surface-container-lowest text-primary shadow-elevation-1"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {op}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-xs max-w-sm">
          <span className="font-label-md font-semibold text-on-surface">Table Name</span>
          <input
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="table_name"
            className="w-full border border-outline-variant rounded-lg px-md py-md font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
          />
        </label>

        {operation === "CREATE" ? (
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-headline-sm text-on-surface">Columns</h3>
              <button
                type="button"
                onClick={() => setColumns((prev) => [...prev, newColumn()])}
                className="flex items-center gap-xs text-label-md font-semibold text-primary hover:underline"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add New Column
              </button>
            </div>

            <div className="flex flex-col gap-md">
              {columns.map((col) => (
                <div key={col.id} className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-md flex flex-col gap-md">
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <h4 className="font-label-md font-semibold text-on-surface">Column</h4>
                      <p className="text-label-sm text-on-surface-variant">Define the field, type, size, and constraints.</p>
                    </div>
                    {columns.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove column"
                        onClick={() => setColumns((prev) => prev.filter((c) => c.id !== col.id))}
                        className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                    <label className="flex flex-col gap-xs">
                      <span className="text-label-sm text-outline uppercase tracking-wider">Column Name</span>
                      <input
                        value={col.name}
                        onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                        placeholder="column_name"
                        className="w-full border border-outline-variant rounded-md px-sm py-2 font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                    </label>
                    <label className="flex flex-col gap-xs">
                      <span className="text-label-sm text-outline uppercase tracking-wider">Data Type</span>
                      <select
                        value={col.dataType}
                        onChange={(e) => updateColumn(col.id, { dataType: e.target.value as ColumnDef["dataType"] })}
                        className="w-full border border-outline-variant rounded-md px-sm py-2 font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      >
                        {DATA_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-xs">
                      <span className="text-label-sm text-outline uppercase tracking-wider">Size / Length</span>
                      <input
                        value={col.size}
                        onChange={(e) => updateColumn(col.id, { size: e.target.value })}
                        placeholder="255"
                        className="w-full border border-outline-variant rounded-md px-sm py-2 font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                    {(
                      [
                        ["primaryKey", "Primary Key"],
                        ["autoIncrement", "Auto Increment"],
                        ["notNull", "Not Null"],
                        ["unique", "Unique"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between gap-sm rounded-md border border-outline-variant/40 px-sm py-2">
                        <span className="text-label-sm text-on-surface-variant truncate">{label}</span>
                        <Switch checked={col[key]} onChange={(v) => updateColumn(col.id, { [key]: v })} label={label} labelHidden />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {(operation === "SELECT" || operation === "INSERT" || operation === "UPDATE") && (
              <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-headline-sm text-on-surface">{FIELD_LABEL[operation]}</h3>
                  <button
                    type="button"
                    onClick={() => setFields((prev) => [...prev, newField()])}
                    className="flex items-center gap-xs text-label-md font-semibold text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Field
                  </button>
                </div>
                <div className="flex flex-col gap-sm">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-sm">
                      <input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="column_name"
                        className="flex-1 border border-outline-variant rounded-md px-sm py-2 font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                      {operation !== "SELECT" && (
                        <input
                          value={field.value}
                          onChange={(e) => updateField(field.id, { value: e.target.value })}
                          placeholder="value"
                          className="flex-1 border border-outline-variant rounded-md px-sm py-2 font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                        />
                      )}
                      {fields.length > 1 && (
                        <button
                          type="button"
                          aria-label="Remove field"
                          onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
                          className="p-2 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="flex flex-col gap-xs">
              <span className="font-label-md font-semibold text-on-surface">WHERE clause</span>
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="id = 1"
                disabled={operation === "INSERT"}
                className="w-full border border-outline-variant rounded-lg px-md py-md font-mono text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all disabled:opacity-40"
              />
            </label>
          </div>
        )}
      </div>

      {/* Live SQL output + execution metrics */}
      <div className="shrink-0 w-[clamp(210px,28vw,300px)] max-w-full border-l border-border-subtle bg-surface-container-lowest flex flex-col p-lg gap-lg overflow-y-auto scrollbar-thin">
        <div>
          <h2 className="font-heading text-headline-sm text-on-surface mb-sm">Live SQL Output</h2>
          <CodeBlock sql={sql} />
          <p className="mt-sm flex items-center gap-xs text-label-sm text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Query generated successfully.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="w-full flex items-center justify-center gap-xs py-md rounded-full bg-success text-on-success font-label-md font-semibold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_12px_rgba(52,211,153,0.25)] disabled:opacity-60"
        >
          {running && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {running ? "Running…" : "Run Query"}
        </button>

        <div>
          <h3 className="font-label-md font-semibold text-on-surface mb-sm">Execution Metrics</h3>
          <div className="grid grid-cols-2 gap-sm">
            <div className="rounded-lg border border-outline-variant/40 p-sm">
              <div className="text-label-sm text-outline uppercase tracking-wider">Time</div>
              <div className="font-mono text-headline-sm text-on-surface">{metrics?.time ?? "–"}</div>
            </div>
            <div className="rounded-lg border border-outline-variant/40 p-sm">
              <div className="text-label-sm text-outline uppercase tracking-wider">Rows</div>
              <div className="font-mono text-headline-sm text-on-surface">{metrics?.rows ?? "–"}</div>
            </div>
          </div>
          <div
            className={cn(
              "mt-sm flex items-center gap-xs text-label-sm rounded-full px-md py-1.5 border w-fit",
              metrics ? "bg-success/10 text-success border-success/20" : "bg-surface-container-low text-on-surface-variant border-outline-variant/40"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", metrics ? "bg-success" : "bg-outline")} aria-hidden="true" />
            {metrics ? "Executed" : "Ready to Execute"}
          </div>
        </div>
      </div>
    </div>
  );
}
