"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  Blocks,
  Building2,
  GraduationCap,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Wand2,
} from "lucide-react";
import { ConnectionBadge } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/Toast";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { WorkspaceSkeleton } from "@/components/ui/Skeleton";
import { findTableById } from "@/components/schema/SchemaTree";
import { TablePalette } from "@/components/builder/TablePalette";
import { QueryCanvas, type SuggestedJoin } from "@/components/builder/QueryCanvas";
import { JoinBuilder } from "@/components/builder/JoinBuilder";
import { ConditionBuilder } from "@/components/builder/ConditionBuilder";
import { GroupByBuilder } from "@/components/builder/GroupByBuilder";
import { OrderByBuilder } from "@/components/builder/OrderByBuilder";
import { BuilderToolbar } from "@/components/builder/BuilderToolbar";
import { SqlPreviewPanel } from "@/components/builder/SqlPreviewPanel";
import { TableBuilderPanel } from "@/components/builder/TableBuilderPanel";
import { buildSqlFromState, createEmptyBuilderState, nextBuilderId } from "@/lib/sql-builder";
import { useSqlStore } from "@/lib/useSqlStore";
import { DB_TEMPLATE_LIST, type DbTemplateId } from "@/lib/db-templates";
import { cn } from "@/lib/utils";
import type {
  AggregateFn,
  BuilderCondition,
  BuilderGroupByField,
  BuilderJoin,
  BuilderOrderBy,
  BuilderState,
  SchemaTable,
} from "@/lib/types";

const TEMPLATE_ICONS: Record<DbTemplateId, ComponentType<{ className?: string }>> = {
  university: GraduationCap,
  company: Building2,
};

const TABS = ["Joins", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"] as const;
type Tab = (typeof TABS)[number];

/** Generates a short unique alias for a table, e.g. "u", "u2", "u3". */
function generateAlias(existing: string[], name: string): string {
  const base = name.charAt(0).toLowerCase() || "t";
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export default function ManualBuilderPage() {
  const { showToast } = useToast();

  const [state, setState] = useState<BuilderState>(createEmptyBuilderState());
  const [past, setPast] = useState<BuilderState[]>([]);
  const [future, setFuture] = useState<BuilderState[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSnapshot = useRef<BuilderState | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("Joins");
  const [saved, setSaved] = useState(false);
  const [tablesVisible, setTablesVisible] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [mode, setMode] = useState<"query" | "table">("query");

  const {
    isDbReady,
    isDbInitializing,
    isExecuting,
    activeTemplateId,
    queryResult,
    initDb,
    executeSql,
    loadTemplate,
  } = useSqlStore();

  // Boot the real (WASM) Postgres instance once, on mount. executeSql() and
  // loadTemplate() also lazily boot it if this hasn't resolved yet by the
  // time the user clicks something, so there's no race — this just makes the
  // common case (open the page, then click) not pay a 1-2s boot cost on the
  // very first action.
  useEffect(() => {
    initDb();
  }, [initDb]);

  const { sql, errors } = useMemo(() => buildSqlFromState(state), [state]);

  const activeTemplate = activeTemplateId ? DB_TEMPLATE_LIST.find((t) => t.id === activeTemplateId) : null;
  const connectionLabel = isDbInitializing
    ? "Booting PostgreSQL…"
    : activeTemplate
      ? `PostgreSQL · ${activeTemplate.name}`
      : "PostgreSQL (Local)";

  function commit(updater: (prev: BuilderState) => BuilderState, options?: { debounce?: boolean }) {
    setState((prev) => {
      const next = updater(prev);
      if (options?.debounce) {
        if (!pendingSnapshot.current) pendingSnapshot.current = prev;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          if (pendingSnapshot.current) {
            setPast((p) => [...p, pendingSnapshot.current as BuilderState]);
            pendingSnapshot.current = null;
          }
          setFuture([]);
        }, 600);
      } else {
        setPast((p) => [...p, prev]);
        setFuture([]);
      }
      return next;
    });
    setSaved(false);
  }

  function undo() {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      if (!previous) return p;
      setFuture((f) => [state, ...f]);
      setState(previous);
      return p.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nextState = f[0];
      if (!nextState) return f;
      setPast((p) => [...p, state]);
      setState(nextState);
      return f.slice(1);
    });
  }

  // --- Tables ---
  function handleAddTable(table: SchemaTable) {
    commit((prev) => {
      const alias = generateAlias(prev.tables.map((t) => t.alias), table.name);
      return { ...prev, tables: [...prev.tables, { instanceId: nextBuilderId("tbl"), tableId: table.id, alias }] };
    });
  }

  function handleAddTableById(tableId: string) {
    const table = findTableById(tableId);
    if (table) handleAddTable(table);
  }

  function handleRemoveTable(instanceId: string) {
    commit((prev) => ({
      tables: prev.tables.filter((t) => t.instanceId !== instanceId),
      columns: prev.columns.filter((c) => c.instanceId !== instanceId),
      joins: prev.joins.filter((j) => j.leftInstanceId !== instanceId && j.rightInstanceId !== instanceId),
      where: prev.where.filter((c) => c.instanceId !== instanceId),
      groupBy: prev.groupBy.filter((g) => g.instanceId !== instanceId),
      having: prev.having.filter((c) => c.instanceId !== instanceId),
      orderBy: prev.orderBy.filter((o) => o.instanceId !== instanceId),
      limit: prev.limit,
    }));
  }

  function handleAliasChange(instanceId: string, alias: string) {
    commit(
      (prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.instanceId === instanceId ? { ...t, alias } : t)),
      }),
      { debounce: true }
    );
  }

  // --- Columns ---
  function handleToggleColumn(instanceId: string, columnId: string) {
    commit((prev) => {
      const exists = prev.columns.find((c) => c.instanceId === instanceId && c.columnId === columnId);
      if (exists) {
        return { ...prev, columns: prev.columns.filter((c) => c.id !== exists.id) };
      }
      return {
        ...prev,
        columns: [...prev.columns, { id: nextBuilderId("col"), instanceId, columnId, aggregate: "NONE" as AggregateFn }],
      };
    });
  }

  function handleAggregateChange(columnEntryId: string, aggregate: AggregateFn) {
    commit((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.id === columnEntryId ? { ...c, aggregate } : c)),
    }));
  }

  // --- Joins ---
  function handleAddSuggestedJoin(suggestion: SuggestedJoin) {
    commit((prev) => ({
      ...prev,
      joins: [...prev.joins, { id: nextBuilderId("join"), type: "INNER", ...suggestion }],
    }));
    setActiveTab("Joins");
  }

  function handleAddJoin() {
    commit((prev) => {
      const [left, right] = prev.tables;
      const newJoin: BuilderJoin = {
        id: nextBuilderId("join"),
        leftInstanceId: left?.instanceId ?? "",
        leftColumnId: "",
        rightInstanceId: right?.instanceId ?? left?.instanceId ?? "",
        rightColumnId: "",
        type: "INNER",
      };
      return { ...prev, joins: [...prev.joins, newJoin] };
    });
  }

  function handleUpdateJoin(id: string, patch: Partial<BuilderJoin>) {
    commit((prev) => ({ ...prev, joins: prev.joins.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  }

  function handleRemoveJoin(id: string) {
    commit((prev) => ({ ...prev, joins: prev.joins.filter((j) => j.id !== id) }));
  }

  // --- WHERE / HAVING (shared shape) ---
  function makeConditionHandlers(key: "where" | "having") {
    return {
      onAdd: () =>
        commit((prev) => {
          const newCondition: BuilderCondition = {
            id: nextBuilderId(key),
            instanceId: prev.tables[0]?.instanceId ?? "",
            columnId: "",
            operator: "=",
            value: "",
            connector: "AND",
          };
          return { ...prev, [key]: [...prev[key], newCondition] };
        }),
      onUpdate: (id: string, patch: Partial<BuilderCondition>) =>
        commit(
          (prev) => ({
            ...prev,
            [key]: prev[key].map((c) => (c.id === id ? { ...c, ...patch } : c)),
          }),
          { debounce: "value" in patch }
        ),
      onRemove: (id: string) => commit((prev) => ({ ...prev, [key]: prev[key].filter((c) => c.id !== id) })),
    };
  }
  const whereHandlers = makeConditionHandlers("where");
  const havingHandlers = makeConditionHandlers("having");

  // --- GROUP BY ---
  function handleAddGroupBy() {
    commit((prev) => {
      const field: BuilderGroupByField = {
        id: nextBuilderId("grp"),
        instanceId: prev.tables[0]?.instanceId ?? "",
        columnId: "",
      };
      return { ...prev, groupBy: [...prev.groupBy, field] };
    });
  }
  function handleUpdateGroupBy(id: string, patch: Partial<BuilderGroupByField>) {
    commit((prev) => ({ ...prev, groupBy: prev.groupBy.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }
  function handleRemoveGroupBy(id: string) {
    commit((prev) => ({ ...prev, groupBy: prev.groupBy.filter((g) => g.id !== id) }));
  }

  // --- ORDER BY ---
  function handleAddOrderBy() {
    commit((prev) => {
      const field: BuilderOrderBy = {
        id: nextBuilderId("ord"),
        instanceId: prev.tables[0]?.instanceId ?? "",
        columnId: "",
        direction: "ASC",
      };
      return { ...prev, orderBy: [...prev.orderBy, field] };
    });
  }
  function handleUpdateOrderBy(id: string, patch: Partial<BuilderOrderBy>) {
    commit((prev) => ({ ...prev, orderBy: prev.orderBy.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  }
  function handleRemoveOrderBy(id: string) {
    commit((prev) => ({ ...prev, orderBy: prev.orderBy.filter((o) => o.id !== id) }));
  }
  function handleReorderOrderBy(fromIndex: number, toIndex: number) {
    commit((prev) => {
      const next = [...prev.orderBy];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return { ...prev, orderBy: next };
    });
  }

  // --- LIMIT ---
  function handleLimitChange(value: string) {
    const parsed = value === "" ? null : Math.max(0, parseInt(value, 10) || 0);
    commit((prev) => ({ ...prev, limit: parsed }), { debounce: true });
  }

  // --- Toolbar actions ---
  function handleRun() {
    if (errors.length > 0) return;
    executeSql(sql);
  }

  function handleExport() {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "query.sql";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded query.sql");
  }

  function handleSave() {
    setSaved((v) => !v);
    showToast(saved ? "Removed from saved queries" : "Saved to Saved Queries");
  }

  return (
    <LoadingReveal skeleton={<WorkspaceSkeleton />} className="flex-1 flex flex-col min-h-0">
      <div className="h-12 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle bg-surface-container-lowest gap-md">
        <div className="flex items-center gap-md min-w-0">
          {mode === "query" && (
            <IconButton
              aria-label={tablesVisible ? "Hide table palette" : "Show table palette"}
              onClick={() => setTablesVisible((v) => !v)}
            >
              {tablesVisible ? (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              )}
            </IconButton>
          )}
          <Blocks className="h-5 w-5 text-secondary shrink-0" aria-hidden="true" />
          <h1 className="font-heading text-headline-sm text-on-surface truncate">Manual SQL Builder</h1>
          <span className="hidden xl:inline text-label-sm text-outline">
            {mode === "query"
              ? "Click-and-drag query construction — no SQL required."
              : "Form-based DDL/DML — pick an operation and fill in the fields."}
          </span>
        </div>
        <div className="flex items-center gap-md shrink-0">
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg" role="tablist" aria-label="Builder mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "query"}
              onClick={() => setMode("query")}
              className={cn(
                "flex items-center gap-xs px-md py-1.5 rounded-md text-label-md font-semibold transition-colors",
                mode === "query"
                  ? "bg-surface-container-lowest text-secondary shadow-elevation-1"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Blocks className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Query Builder</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "table"}
              onClick={() => setMode("table")}
              className={cn(
                "flex items-center gap-xs px-md py-1.5 rounded-md text-label-md font-semibold transition-colors",
                mode === "table"
                  ? "bg-surface-container-lowest text-secondary shadow-elevation-1"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Table Builder</span>
            </button>
          </div>
          <div
            className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg"
            role="group"
            aria-label="Load a database schema"
          >
            <span className="hidden lg:inline pl-sm pr-xs text-label-sm text-outline">Schema</span>
            {DB_TEMPLATE_LIST.map((template) => {
              const Icon = TEMPLATE_ICONS[template.id];
              const isActive = activeTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  title={template.description}
                  disabled={isDbInitializing}
                  onClick={() => loadTemplate(template.id)}
                  className={cn(
                    "flex items-center gap-xs px-md py-1.5 rounded-md text-label-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    isActive
                      ? "bg-surface-container-lowest text-secondary shadow-elevation-1"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {isDbInitializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{template.name}</span>
                </button>
              );
            })}
          </div>
          <ConnectionBadge label={connectionLabel} />
          {mode === "query" && (
            <IconButton
              aria-label={previewVisible ? "Hide SQL preview" : "Show SQL preview"}
              active={previewVisible}
              onClick={() => setPreviewVisible((v) => !v)}
            >
              {previewVisible ? (
                <PanelRightClose className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelRightOpen className="h-5 w-5" aria-hidden="true" />
              )}
            </IconButton>
          )}
        </div>
      </div>

      {mode === "query" && (
        <div className="relative flex-1 flex flex-col min-h-0">
          <BuilderToolbar
            onUndo={undo}
            onRedo={redo}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onRun={handleRun}
            onExport={handleExport}
            onSave={handleSave}
            saved={saved}
            running={isExecuting}
            hasErrors={errors.length > 0 || !isDbReady}
          />

      <div className="flex-1 flex min-h-0">
        {tablesVisible && (
          <TablePalette onAddTable={handleAddTable} addedTableIds={state.tables.map((t) => t.tableId)} />
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <QueryCanvas
            tables={state.tables}
            columns={state.columns}
            joins={state.joins}
            onDropTable={handleAddTableById}
            onRemoveTable={handleRemoveTable}
            onAliasChange={handleAliasChange}
            onToggleColumn={handleToggleColumn}
            onAggregateChange={handleAggregateChange}
            onAddSuggestedJoin={handleAddSuggestedJoin}
          />

        {/* Bottom tab panel — shrink-0 prevents it from collapsing but
            max-h caps it so it never eats the whole canvas on small screens. */}
          <div className="shrink-0 max-h-72 border-t border-border-subtle bg-surface-container-lowest flex flex-col">
            <nav className="flex gap-lg px-lg border-b border-border-subtle overflow-x-auto scrollbar-hide" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "py-sm font-label-md whitespace-nowrap transition-colors border-b-2",
                    activeTab === tab
                      ? "text-primary font-bold border-primary"
                      : "text-on-surface-variant hover:text-on-surface border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-md">
              {activeTab === "Joins" && (
                <JoinBuilder
                  tables={state.tables}
                  joins={state.joins}
                  onAdd={handleAddJoin}
                  onUpdate={handleUpdateJoin}
                  onRemove={handleRemoveJoin}
                />
              )}
              {activeTab === "WHERE" && (
                <ConditionBuilder
                  keyword="WHERE"
                  tables={state.tables}
                  conditions={state.where}
                  onAdd={whereHandlers.onAdd}
                  onUpdate={whereHandlers.onUpdate}
                  onRemove={whereHandlers.onRemove}
                  emptyLabel="Add a table before filtering rows."
                  addLabel="Add condition"
                />
              )}
              {activeTab === "GROUP BY" && (
                <GroupByBuilder
                  tables={state.tables}
                  fields={state.groupBy}
                  onAdd={handleAddGroupBy}
                  onUpdate={handleUpdateGroupBy}
                  onRemove={handleRemoveGroupBy}
                />
              )}
              {activeTab === "HAVING" && (
                <ConditionBuilder
                  keyword="HAVING"
                  tables={state.tables}
                  conditions={state.having}
                  onAdd={havingHandlers.onAdd}
                  onUpdate={havingHandlers.onUpdate}
                  onRemove={havingHandlers.onRemove}
                  emptyLabel="Add a table before filtering aggregates."
                  addLabel="Add having condition"
                />
              )}
              {activeTab === "ORDER BY" && (
                <OrderByBuilder
                  tables={state.tables}
                  fields={state.orderBy}
                  onAdd={handleAddOrderBy}
                  onUpdate={handleUpdateOrderBy}
                  onRemove={handleRemoveOrderBy}
                  onReorder={handleReorderOrderBy}
                />
              )}
              {activeTab === "LIMIT" && (
                <div className="flex items-center gap-sm">
                  <label htmlFor="limit-input" className="font-label-md text-on-surface-variant">
                    Limit results to
                  </label>
                  <input
                    id="limit-input"
                    type="number"
                    min={0}
                    value={state.limit ?? ""}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="w-28 font-mono text-label-md border border-outline-variant rounded bg-surface-container-lowest px-2 py-1.5"
                  />
                  <span className="text-body-md text-on-surface-variant">rows</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {previewVisible && <SqlPreviewPanel sql={sql} errors={errors} result={queryResult} />}
      </div>

          {!isDbReady && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-md bg-surface-container-lowest/90 backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-primary animate-spin" aria-hidden="true" />
              </div>
              <div className="max-w-sm text-center">
                <h3 className="font-heading text-headline-sm text-on-surface">Booting the PostgreSQL engine</h3>
                <p className="font-sans text-body-md text-on-surface-variant mt-1">
                  Starting a real Postgres instance in your browser (WASM). This only takes a moment.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "table" && <TableBuilderPanel />}
      </LoadingReveal>
  );
}
