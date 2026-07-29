"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  FileCode,
  GraduationCap,
  Loader2,
  Plus,
  Terminal,
  Trash2,
  Upload,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ConnectionBadge } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { WorkspaceSkeleton } from "@/components/ui/Skeleton";
import { SchemaTree, getDefaultTable } from "@/components/schema/SchemaTree";
import { SqlWorkspaceEditor } from "@/components/sql/SqlWorkspaceEditor";
import { ResultsConsole } from "@/components/sql/ResultsConsole";
import { useSqlStore } from "@/lib/useSqlStore";
import { DB_TEMPLATE_LIST, type DbTemplateId } from "@/lib/db-templates";
import type { EditorTab, EditorLogEntry } from "@/lib/mock-data";
import type { SchemaTable } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<DbTemplateId, ComponentType<{ className?: string }>> = {
  university: GraduationCap,
  company: Building2,
};

const DEFAULT_TABS: EditorTab[] = [
  {
    id: "tab-1",
    name: "getting_started.sql",
    sql: `-- Welcome! This runs on a real, in-browser PostgreSQL engine (PGlite) —
-- not a simulation. Pick a schema from the "Schema" menu above, then
-- run this with the Run button (or Ctrl/Cmd + Enter).

SELECT * FROM students
ORDER BY gpa DESC
LIMIT 10;
`,
  },
  {
    id: "tab-2",
    name: "aggregates.sql",
    sql: `SELECT major, ROUND(AVG(gpa), 2) AS avg_gpa, COUNT(*) AS students
FROM students
GROUP BY major
ORDER BY avg_gpa DESC;
`,
  },
  {
    id: "tab-3",
    name: "joins.sql",
    sql: `SELECT s.first_name, s.last_name, c.course_name, e.grade
FROM enrollments e
JOIN students s ON s.student_id = e.student_id
JOIN courses c ON c.course_id = e.course_id
ORDER BY s.last_name;
`,
  },
];

// Module-level fallback only — actual untitled counter is a ref inside the component.
const FALLBACK_TAB: EditorTab = { id: "fallback", name: "untitled.sql", sql: "" };
const ROW_LIMITS = ["10", "50", "1000", "No Limit"] as const;

export default function EditorPage() {
  // useRef for untitledCounter so it doesn't reset on re-renders and
  // doesn't cause extra renders when incremented (previously a module-level
  // let, which leaked state across HMR hot-reloads in dev).
  const untitledCounter = useRef(1);

  const [tabs, setTabs] = useState<EditorTab[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState(DEFAULT_TABS[0]?.id ?? "");
  const [navigatorVisible, setNavigatorVisible] = useState(true);
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(getDefaultTable());
  const [log, setLog] = useState<EditorLogEntry[]>([]);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [rowLimit, setRowLimit] = useState<(typeof ROW_LIMITS)[number]>("1000");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  // Controls whether the ResultsConsole is visible at all (shown after first run)
  const [resultsVisible, setResultsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isDbInitializing,
    isDbReady,
    isExecuting,
    activeTemplateId,
    queryResult,
    initDb,
    executeSql,
    loadTemplate,
  } = useSqlStore();

  useEffect(() => {
    initDb();
  }, [initDb]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0] ?? FALLBACK_TAB;
  const successCount = useMemo(() => log.filter((e) => e.status === "success").length, [log]);
  const errorCount = log.length - successCount;
  const activeTemplate = activeTemplateId ? DB_TEMPLATE_LIST.find((t) => t.id === activeTemplateId) : null;
  const connectionLabel = isDbInitializing
    ? "Booting PostgreSQL…"
    : activeTemplate
      ? `PostgreSQL · ${activeTemplate.name}`
      : "PostgreSQL (Local)";

  function updateActiveTabSql(value: string) {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, sql: value, dirty: true } : t)));
  }

  function addTab() {
    const id = `tab-untitled-${Date.now()}`;
    const name = `untitled_${untitledCounter.current++}.sql`;
    setTabs((prev) => [...prev, { id, name, sql: "-- New query here\n" }]);
    setActiveTabId(id);
  }

  function closeTab(id: string) {
    setTabs((prev) => {
      if (prev.length === 1) return prev;
      const closingIndex = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        const fallback = next[Math.max(0, closingIndex - 1)] ?? next[0];
        if (fallback) setActiveTabId(fallback.id);
      }
      return next;
    });
  }

  function handleSelectTable(table: SchemaTable) {
    setSelectedTable(table);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, sql: `${t.sql.replace(/\n+$/, "")}\n\nSELECT * FROM ${table.name};\n`, dirty: true }
          : t
      )
    );
  }

  function handleExport() {
    const blob = new Blob([activeTab.sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeTab.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = `tab-import-${Date.now()}`;
      setTabs((prev) => [...prev, { id, name: file.name, sql: String(reader.result ?? "") }]);
      setActiveTabId(id);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function runQuery() {
    const result = await executeSql(activeTab.sql);
    if (!result) return;

    setResultsVisible(true);
    const now = new Date();
    setLog((prev) => [
      {
        id: `log-${Date.now()}`,
        time: now.toLocaleTimeString([], { hour12: false }),
        action: activeTab.name,
        message:
          result.status === "error"
            ? (result.errorMessage ?? "Query failed")
            : result.columns.length > 0
              ? `${result.rowCount} row(s) returned`
              : `${result.rowCount} row(s) affected`,
        duration: `${(result.executionMs / 1000).toFixed(3)} sec`,
        status: result.status === "error" ? "error" : "success",
      },
      ...prev,
    ]);
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, dirty: false } : t)));
    setLastRunAt(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <LoadingReveal skeleton={<WorkspaceSkeleton />} className="flex-1 flex flex-col min-h-0">
      {/* Page header */}
      <div className="h-12 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle bg-surface-container-lowest">
        <div className="flex items-center gap-md min-w-0">
          <IconButton
            aria-label={navigatorVisible ? "Hide navigator" : "Show navigator"}
            onClick={() => setNavigatorVisible((v) => !v)}
          >
            {navigatorVisible ? (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            )}
          </IconButton>
          <h1 className="font-heading text-headline-sm text-on-surface truncate">Editor</h1>
          <span className="hidden lg:inline text-label-sm text-outline">
            Multi-tab SQL editor with schema navigator and instant execution.
          </span>
        </div>
        <div className="flex items-center gap-sm shrink-0">
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
        </div>
      </div>

      {/* Toolbar + tab strip */}
      <div className="h-12 shrink-0 flex items-stretch gap-sm px-sm bg-surface-container-low border-b border-border-subtle">
        <div className="flex items-center gap-sm shrink-0 border-r border-border-subtle pr-sm">
          <label htmlFor="row-limit" className="sr-only">Row limit</label>
          <select
            id="row-limit"
            value={rowLimit}
            onChange={(e) => setRowLimit(e.target.value as (typeof ROW_LIMITS)[number])}
            className="h-8 rounded-md bg-surface-container-lowest border border-outline-variant text-label-sm text-on-surface-variant px-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          >
            {ROW_LIMITS.map((limit) => (
              <option key={limit} value={limit}>
                {limit === "No Limit" ? limit : `${limit} rows`}
              </option>
            ))}
          </select>
          <IconButton aria-label="Export active file" onClick={handleExport}>
            <Download className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Import a .sql file" onClick={handleImportClick}>
            <Upload className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql,.txt"
            onChange={handleImportFile}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <div
          className="flex-1 flex items-stretch gap-0.5 pt-1.5 overflow-x-auto scrollbar-hide min-w-0"
          role="tablist"
          aria-label="Open script tabs"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "group flex items-center gap-xs pl-sm pr-1.5 rounded-t-lg border border-b-0 cursor-pointer transition-colors max-w-[150px] shrink-0",
                  isActive
                    ? "bg-surface-container-lowest border-border-subtle text-on-surface"
                    : "bg-transparent border-transparent text-on-surface-variant hover:bg-surface-container-lowest/50"
                )}
                onClick={() => setActiveTabId(tab.id)}
              >
                <FileCode className="h-[10.5px] w-[10.5px] shrink-0 text-primary" aria-hidden="true" />
                <span className="font-mono text-label-sm truncate py-2">{tab.name}</span>
                {tab.dirty && (
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary shrink-0" aria-label="Unsaved changes" />
                )}
                {tabs.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Close ${tab.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 p-0.5 rounded hover:bg-surface-container-highest transition-opacity"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addTab}
            aria-label="New script tab"
            className="self-center ml-1 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main content — flex row: navigator + editor column */}
      <div className="flex-1 flex min-h-0">
        {navigatorVisible && (
          <SchemaTree selectedTableId={selectedTable.id} onSelectTable={handleSelectTable} />
        )}

        {/* Editor column — flex column that must NOT overflow */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* SQL editor pane — takes all remaining space above the panels */}
          <div className="flex-1 min-h-0 p-lg">
            <SqlWorkspaceEditor
              filename={activeTab.name}
              value={activeTab.sql}
              onChange={updateActiveTabSql}
              onRun={runQuery}
              running={isExecuting}
              onCursorChange={setCursor}
            />
          </div>

          {/* Results console — shrink-0 so it never steals flex space from the
              editor; max-h-64 caps it so it can't push the log/statusbar off screen. */}
          {resultsVisible && queryResult && (
            <div className="shrink-0 max-h-64 overflow-y-auto border-t border-border-subtle">
              <ResultsConsole result={queryResult} />
            </div>
          )}

          {/* Query activity log */}
          <section
            className={cn(
              "shrink-0 border-t border-border-subtle bg-surface-container-lowest flex flex-col transition-[height] duration-200",
              logCollapsed ? "h-12" : "h-40"
            )}
            aria-label="Query log"
          >
            <div className="h-12 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle">
              <div className="flex items-center gap-sm min-w-0">
                <Terminal className="h-[13.5px] w-[13.5px] text-on-surface-variant" aria-hidden="true" />
                <span className="font-label-md font-semibold text-on-surface">Query Log</span>
                <span className="text-label-sm text-on-surface-variant hidden sm:inline">
                  <span className="text-success font-semibold">{successCount} successful</span>
                  {" · "}
                  <span className={errorCount > 0 ? "text-error font-semibold" : ""}>{errorCount} errors</span>
                </span>
              </div>
              <div className="flex items-center gap-xs shrink-0">
                <IconButton aria-label="Clear query log" onClick={() => setLog([])}>
                  <Trash2 className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                </IconButton>
                <button
                  type="button"
                  onClick={() => setLogCollapsed((v) => !v)}
                  aria-label={logCollapsed ? "Expand query log" : "Collapse query log"}
                  aria-expanded={!logCollapsed}
                  className="p-1 hover:bg-surface-container-highest rounded transition-colors text-outline"
                >
                  {logCollapsed ? (
                    <ChevronUp className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {!logCollapsed && (
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/50 sticky top-0 text-label-sm text-outline">
                    <tr>
                      <th className="px-lg py-1.5 font-medium whitespace-nowrap">Time</th>
                      <th className="px-lg py-1.5 font-medium whitespace-nowrap">Action</th>
                      <th className="px-lg py-1.5 font-medium whitespace-nowrap">Message</th>
                      <th className="px-lg py-1.5 font-medium whitespace-nowrap">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-body-md text-on-surface-variant">
                    {log.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-1.5 font-mono text-label-sm whitespace-nowrap">{entry.time}</td>
                        <td className="px-lg py-1.5 font-mono text-label-sm text-on-surface whitespace-nowrap truncate max-w-[165px]">
                          {entry.action}
                        </td>
                        <td className="px-lg py-1.5 whitespace-nowrap">{entry.message}</td>
                        <td className="px-lg py-1.5 font-mono text-label-sm whitespace-nowrap">{entry.duration}</td>
                      </tr>
                    ))}
                    {log.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-lg py-lg text-center text-on-surface-variant">
                          No statements executed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Status bar — always visible, always at the bottom */}
          <div className="h-7 shrink-0 flex items-center justify-between px-lg border-t border-border-subtle bg-surface-container-lowest text-label-sm text-outline font-mono">
            <div className="flex items-center gap-md">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isDbInitializing ? "bg-tertiary animate-pulse" : isDbReady ? "bg-success" : "bg-outline-variant"
                  )}
                  aria-hidden="true"
                />
                {isDbInitializing ? "Booting…" : isDbReady ? "Ready" : "Not connected"}
              </span>
              {lastRunAt && <span className="hidden sm:inline">Last run: {lastRunAt}</span>}
              <span className="hidden md:inline">UTF-8</span>
              <span className="hidden md:inline">PostgreSQL (PGlite)</span>
            </div>
            <span>
              Line {cursor.line}, Col {cursor.column}
            </span>
          </div>
        </div>
      </div>
    </LoadingReveal>
  );
}
