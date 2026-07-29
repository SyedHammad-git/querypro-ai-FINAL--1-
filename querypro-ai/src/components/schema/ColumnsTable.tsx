"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Code2,
  DatabaseZap,
  Fingerprint,
  Key,
  Link2,
  Loader2,
  RefreshCw,
  Table2,
} from "lucide-react";
import type { SchemaTable } from "@/lib/types";
import { formatBytes, formatCount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

const TABS = ["Columns", "Indexes", "Foreign Keys", "Triggers"] as const;
type Tab = (typeof TABS)[number];

function buildDdl(table: SchemaTable): string {
  if (table.columns.length === 0) {
    return `CREATE TABLE public.${table.name} (\n  -- no column metadata indexed for this object yet\n);`;
  }
  const lines = table.columns.map((col) => {
    const nullability = col.nullable ? "" : " NOT NULL";
    const defaultClause = col.default ? ` DEFAULT ${col.default}` : "";
    const constraint =
      col.constraint === "primary-key"
        ? " PRIMARY KEY"
        : col.constraint === "unique"
          ? " UNIQUE"
          : col.constraint === "foreign-key" && col.referencedTable
            ? ` REFERENCES ${col.referencedTable}`
            : "";
    return `  ${col.name} ${col.type}${nullability}${defaultClause}${constraint}`;
  });
  return `CREATE TABLE public.${table.name} (\n${lines.join(",\n")}\n);`;
}

function ConstraintIcon({ table, columnId }: { table: SchemaTable; columnId: string }) {
  const column = table.columns.find((c) => c.id === columnId);
  if (!column) return <span className="text-outline">—</span>;

  if (column.constraint === "primary-key") {
    return (
      <span title="Primary key">
        <Key className="h-[13.5px] w-[13.5px] text-primary" aria-hidden="true" />
      </span>
    );
  }
  if (column.constraint === "foreign-key") {
    return (
      <span title={column.referencedTable ? `References ${column.referencedTable}` : "Foreign key"}>
        <Link2 className="h-[13.5px] w-[13.5px] text-outline-variant" aria-hidden="true" />
      </span>
    );
  }
  if (column.constraint === "unique") {
    return (
      <span title="Unique constraint">
        <Fingerprint className="h-[13.5px] w-[13.5px] text-tertiary-container" aria-hidden="true" />
      </span>
    );
  }
  return <span className="text-outline">—</span>;
}

export function ColumnsTable({ table }: { table: SchemaTable }) {
  const [tab, setTab] = useState<Tab>("Columns");
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast(`Schema refreshed for public.${table.name}`);
    }, 700);
  }

  function handleExportDdl() {
    const blob = new Blob([buildDdl(table)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table.name}.sql`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${table.name}.sql`);
  }

  return (
    <section className="flex-1 bg-surface-container-lowest flex flex-col min-w-0" aria-label="Table detail">
      <div className="p-lg border-b border-border-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div className="flex items-center gap-md min-w-0">
          <div className="w-10 h-10 bg-surface-container rounded flex items-center justify-center shrink-0">
            <Table2 className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-headline-md text-on-surface truncate">
              public.{table.name}
            </h2>
            <div className="flex items-center gap-sm mt-xs">
              {table.isPrimary && (
                <span className="px-xs py-[1.5px] bg-secondary/10 text-secondary text-[8.25px] font-mono rounded uppercase">
                  Primary Table
                </span>
              )}
              <span className="text-outline text-xs">•</span>
              <span className="text-on-surface-variant text-xs">Updated {table.updatedAt}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg font-label-md hover:bg-surface-container-low transition-colors disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-[13.5px] w-[13.5px] animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
            )}
            {refreshing ? "Refreshing…" : "Refresh Schema"}
          </button>
          <button
            type="button"
            onClick={handleExportDdl}
            className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-md hover:brightness-110 transition-all active:scale-95"
          >
            <Code2 className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
            Export DDL
          </button>
        </div>
      </div>

      <div className="px-lg border-b border-border-subtle bg-surface-container-lowest">
        <nav className="flex gap-lg overflow-x-auto scrollbar-hide" role="tablist" aria-label="Table detail sections">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "py-md font-label-md whitespace-nowrap transition-colors border-b-2",
                tab === t
                  ? "text-primary font-bold border-primary"
                  : "text-on-surface-variant hover:text-on-surface border-transparent"
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {tab === "Columns" ? (
          table.columns.length === 0 ? (
            <EmptyState
              icon={DatabaseZap}
              title="No columns yet"
              description="No column metadata indexed for this object yet."
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-lowest border-b border-border-subtle z-10">
                <tr>
                  <th className="px-lg py-md font-mono text-label-sm text-outline uppercase tracking-wider">Name</th>
                  <th className="px-lg py-md font-mono text-label-sm text-outline uppercase tracking-wider">Type</th>
                  <th className="px-lg py-md font-mono text-label-sm text-outline uppercase tracking-wider">Default</th>
                  <th className="px-lg py-md font-mono text-label-sm text-outline uppercase tracking-wider">Nullable</th>
                  <th className="px-lg py-md font-mono text-label-sm text-outline uppercase tracking-wider">Constraints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {table.columns.map((column) => (
                  <tr key={column.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-lg py-md font-medium text-on-surface">{column.name}</td>
                    <td className="px-lg py-md">
                      <span className="font-mono text-label-md text-secondary">{column.type}</span>
                    </td>
                    <td className="px-lg py-md text-outline font-mono text-label-md">
                      {column.default ?? "NULL"}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={cn(
                          "px-2 py-1 text-[7.5px] font-bold rounded uppercase",
                          column.nullable ? "bg-success/10 text-success" : "bg-error/10 text-error"
                        )}
                      >
                        {column.nullable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-lg py-md">
                      <ConstraintIcon table={table} columnId={column.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <EmptyState
            icon={DatabaseZap}
            title="Nothing here yet"
            description={`No ${tab.toLowerCase()} configured for public.${table.name} yet.`}
          />
        )}
      </div>

      <div className="border-t border-border-subtle p-md grid grid-cols-2 sm:grid-cols-4 gap-md">
        <Stat label="Row Count" value={formatCount(table.rowCount)} />
        <Stat label="Disk Size" value={formatBytes(table.diskSizeBytes)} />
        <div className="col-span-2 sm:col-span-1 bg-surface-container-low p-md rounded-lg border border-border-subtle">
          <div className="text-[8.25px] font-mono text-outline uppercase">Last Vacuumed</div>
          <div className="flex items-center gap-xs mt-xs">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            <span className="text-body-md text-on-surface-variant">{table.lastVacuumed}</span>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-surface-container-low p-md rounded-lg border border-border-subtle">
          <div className="text-[8.25px] font-mono text-outline uppercase">Object Kind</div>
          <div className="flex items-center gap-xs mt-xs">
            <DatabaseZap className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-body-md text-on-surface-variant capitalize">{table.kind}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low p-md rounded-lg border border-border-subtle">
      <div className="text-[8.25px] font-mono text-outline uppercase">{label}</div>
      <div className="text-lg font-heading font-bold text-on-surface mt-xs">{value}</div>
    </div>
  );
}
