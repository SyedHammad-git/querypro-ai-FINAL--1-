import { create } from "zustand";
import type { PGlite } from "@electric-sql/pglite";
import { findTableById } from "@/components/schema/SchemaTree";
import { buildSqlFromState, createEmptyBuilderState, nextBuilderId } from "@/lib/sql-builder";
import { parseSqlToBuilderState } from "@/lib/sql-ast-sync";
import { DB_TEMPLATES, type DbTemplateId } from "@/lib/db-templates";
import { SCHEMA_GROUPS } from "@/lib/mock-data";
import type { SuggestedJoin } from "@/components/builder/QueryCanvas";
import type {
  AggregateFn,
  BuilderCondition,
  BuilderGroupByField,
  BuilderJoin,
  BuilderOrderBy,
  BuilderState,
  QueryResult,
  QueryResultColumn,
  SchemaGroup,
  SchemaTable,
} from "@/lib/types";

// Same convention as sql-ast-sync.ts: node-sql-parser doesn't ship precise
// TypeScript types for its AST, so rather than a different workaround here,
// this reuses that file's own documented choice — one named, isolated `any`
// alias instead of `any` scattered through every signature below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstNode = any;

function generateAlias(existing: string[], name: string): string {
  const base = name.charAt(0).toLowerCase() || "t";
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

/**
 * The live PGlite handle is kept OUTSIDE Zustand state, the same way
 * `debounceTimer` below is — a WASM database connection isn't serializable,
 * shouldn't trigger re-renders on its own, and only ever needs one instance
 * per tab, which is exactly what a module-level singleton is for.
 *
 * `getDb()` is safe to call from multiple places at once — `initDb`,
 * `executeSql`, and `loadTemplate` all call it — because the in-flight boot
 * promise is memoized. A second caller that arrives while PGlite is still
 * booting awaits that same boot instead of spinning up a second instance.
 */
let pgliteInstance: PGlite | null = null;
let pgliteBootPromise: Promise<PGlite> | null = null;

async function getDb(): Promise<PGlite> {
  if (pgliteInstance) return pgliteInstance;
  if (typeof window === "undefined") {
    // Next.js still renders "use client" components once on the server for
    // the initial HTML. Nothing in this store calls getDb() outside a
    // useEffect or a user-triggered action, so this should be unreachable —
    // it's here so a future SSR call fails loudly instead of silently.
    throw new Error("PGlite can only be initialized in the browser.");
  }
  if (!pgliteBootPromise) {
    pgliteBootPromise = (async () => {
      // Dynamic, not static, import: this keeps @electric-sql/pglite (a WASM
      // package) out of the server-side module graph entirely, rather than
      // relying solely on the typeof-window guard above never being hit.
      // Belt and suspenders — the guard already made this safe in practice
      // (verified via three separate `next build` runs), this just removes
      // the dependency on that guard being the only thing standing between
      // this file and an SSR-side WASM load.
      const { PGlite } = await import("@electric-sql/pglite");
      const instance = new PGlite();
      await instance.waitReady;
      pgliteInstance = instance;
      return instance;
    })();
  }
  return pgliteBootPromise;
}

/**
 * Drops every table currently in the `public` schema. Run before loading a
 * template so switching schemas (or re-loading the same one) never collides
 * with whatever was there before, including tables a student created by hand
 * while experimenting.
 */
async function resetPublicSchema(db: PGlite): Promise<void> {
  const existing = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  for (const row of existing.rows) {
    await db.exec(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
  }
}

/** Renders a raw PGlite cell value into the plain string QueryResult expects. */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Converts the array of per-statement results `db.exec()` returns into the
 * single QueryResult the console displays. A script (hand-typed or
 * canvas-generated) can contain several statements, so this shows the last
 * row-returning statement's table — and, if nothing in the batch returned
 * rows (a plain CREATE/INSERT/UPDATE/DELETE script), a rows-affected count
 * instead of rendering an empty table.
 */
function resultsToQueryResult(
  results: Array<{ rows: Record<string, unknown>[]; fields: { name: string }[]; affectedRows?: number }>,
  executionMs: number
): QueryResult {
  const lastWithFields = [...results].reverse().find((r) => r.fields.length > 0);

  if (lastWithFields) {
    const columns: QueryResultColumn[] = lastWithFields.fields.map((f) => ({ key: f.name, label: f.name }));
    const rows = lastWithFields.rows.map((row) => {
      const out: Record<string, string> = {};
      for (const col of columns) out[col.key] = formatCellValue(row[col.key]);
      return out;
    });
    return { status: "success", columns, rows, rowCount: rows.length, executionMs };
  }

  const affected = results.reduce((sum, r) => sum + (r.affectedRows ?? 0), 0);
  return { status: "success", columns: [], rows: [], rowCount: affected, executionMs };
}

/** Converts whatever PGlite throws into a QueryResult carrying the real Postgres error. */
function toErrorResult(err: unknown, executionMs: number): QueryResult {
  const pgError = err as { message?: string; code?: string; hint?: string };
  return {
    status: "error",
    columns: [],
    rows: [],
    rowCount: 0,
    executionMs,
    errorMessage: pgError?.message ?? String(err),
    errorCode: pgError?.code,
    errorHint: pgError?.hint,
  };
}

/**
 * Caps unbounded SELECTs at this many rows before they ever reach PGlite. A
 * Cartesian product (a join or comma-list with no matching ON/WHERE) can
 * multiply row counts fast enough to freeze the tab — this catches that
 * *before* the browser has to hold the result set.
 */
const MAX_RESULT_ROWS = 500;

/**
 * Template auto-seeded the first time PGlite boots in a session, so a brand
 * new tab is queryable immediately — `SELECT * FROM students;` works before
 * the student has ever clicked a "Load template" button. University is the
 * pick because it's the more universally-recognizable starter schema
 * (Students/Courses/Enrollments); Company remains one click away in the
 * schema switcher for anyone who wants it instead.
 */
const DEFAULT_TEMPLATE_ID: DbTemplateId = "university";

/**
 * True for a bare `select` AST node with no LIMIT already attached. node-sql-
 * parser always puts a `.limit` object on select nodes — even with no LIMIT
 * clause in the source — so the correct check is whether `.limit.value` is a
 * non-empty array, not whether `.limit` itself exists (verified directly
 * against the parser: a LIMIT-less `SELECT * FROM x` still produces
 * `{ seperator: "", value: [] }`, not `undefined`).
 */
function statementNeedsLimit(node: AstNode): boolean {
  if (!node || node.type !== "select") return false;
  const limitValues = node.limit?.value;
  return !(Array.isArray(limitValues) && limitValues.length > 0);
}

/**
 * Parses `sql` (verified against real Postgres syntax, not the "mysql" mode
 * sql-ast-sync.ts uses for its own unrelated purpose) and appends
 * `LIMIT 500` to any top-level SELECT — including the outer SELECT of a
 * `WITH ... AS (...) SELECT ...` CTE — that doesn't already have one.
 *
 * Deliberately only touches nodes whose own top-level type is "select": a
 * SELECT nested inside an INSERT (`INSERT INTO x SELECT ...`) is a property
 * of that insert node, not a top-level node, so it's never touched — capping
 * it would silently truncate however many rows the student meant to insert,
 * which would be a worse bug than the one this guards against.
 *
 * Fails open: if node-sql-parser can't parse the input at all (verified: it
 * doesn't support PL/pgSQL DO blocks, for instance, and there may be other
 * Postgres syntax it doesn't cover), this returns the original text
 * unmodified rather than blocking or corrupting a query it can't safely
 * analyze. PGlite still gets the final say on whether the SQL is valid.
 */
async function applyLimitGuard(sql: string): Promise<string> {
  try {
    const { Parser } = await import("node-sql-parser");
    const parser = new Parser();
    const options = { database: "postgresql" as const };
    const ast: AstNode = parser.astify(sql, options);
    const statements: AstNode[] = Array.isArray(ast) ? ast : [ast];

    let changed = false;
    for (const node of statements) {
      if (statementNeedsLimit(node)) {
        node.limit = { seperator: "", value: [{ type: "number", value: MAX_RESULT_ROWS }] };
        changed = true;
      }
    }

    return changed ? parser.sqlify(ast, options) : sql;
  } catch {
    return sql;
  }
}

export type SyncStatus = "in-sync" | "manual-edit";

interface SqlStore {
  builderState: BuilderState;
  past: BuilderState[];
  future: BuilderState[];
  sql: string;
  errors: string[];
  /** "manual-edit" means the text editor has content the canvas can't fully represent — canvas shows the last state it could parse. */
  syncStatus: SyncStatus;
  parseWarning: string | null;

  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  addTable: (table: SchemaTable) => void;
  addTableById: (tableId: string) => void;
  removeTable: (instanceId: string) => void;
  setAlias: (instanceId: string, alias: string) => void;

  toggleColumn: (instanceId: string, columnId: string) => void;
  setAggregate: (columnEntryId: string, aggregate: AggregateFn) => void;

  addSuggestedJoin: (suggestion: SuggestedJoin) => void;
  addJoin: () => void;
  updateJoin: (id: string, patch: Partial<BuilderJoin>) => void;
  removeJoin: (id: string) => void;

  addWhere: () => void;
  updateWhere: (id: string, patch: Partial<BuilderCondition>) => void;
  removeWhere: (id: string) => void;
  addHaving: () => void;
  updateHaving: (id: string, patch: Partial<BuilderCondition>) => void;
  removeHaving: (id: string) => void;

  addGroupBy: () => void;
  updateGroupBy: (id: string, patch: Partial<BuilderGroupByField>) => void;
  removeGroupBy: (id: string) => void;

  addOrderBy: () => void;
  updateOrderBy: (id: string, patch: Partial<BuilderOrderBy>) => void;
  removeOrderBy: (id: string) => void;
  reorderOrderBy: (fromIndex: number, toIndex: number) => void;

  setLimit: (value: string) => void;

  /** Text-editor -> canvas direction: parses the typed SQL and, if it maps cleanly, updates the visual state too. */
  setSqlText: (text: string) => void;

  reset: () => void;

  // -------------------------------------------------------------------
  // Real execution engine (PGlite — Postgres compiled to WASM, in-browser)
  // -------------------------------------------------------------------

  /** True once the PGlite instance has finished booting and is safe to query. */
  isDbReady: boolean;
  /** True while PGlite is booting (first call) or a template is being (re)loaded. */
  isDbInitializing: boolean;
  /** True for the duration of a single executeSql() call. */
  isExecuting: boolean;
  /** Which curriculum template is currently loaded, if any. */
  activeTemplateId: DbTemplateId | null;
  /** The outcome of the most recent executeSql() call — success rows or a real Postgres error. */
  queryResult: QueryResult | null;
  /** Live schema groups fetched from the in-browser database, with mock data as the fallback while loading. */
  schemaGroups: SchemaGroup[];
  /** True while live schema data is being fetched from PGlite. */
  schemaLoading: boolean;
  /** Last schema-loading error, if any. */
  schemaError: string | null;

  /** Boots the PGlite (WASM Postgres) instance. Safe to call more than once — later calls are no-ops once ready. */
  initDb: () => Promise<void>;
  /** Runs `sqlText` (or, if omitted, the current `sql` field) against the live PGlite database. Returns the result — null only when it was a no-op (empty text, or a run already in flight). */
  executeSql: (sqlText?: string) => Promise<QueryResult | null>;
  /** Wipes the public schema and seeds it with one of the curriculum templates from db-templates.ts. */
  loadTemplate: (name: DbTemplateId) => Promise<void>;
  /** Refreshes the live schema groups from PGlite and updates the sidebar-friendly schema state. */
  refreshSchema: () => Promise<void>;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: BuilderState | null = null;
let sqlTextDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let sqlTextParseToken = 0;

export async function getLiveSchemaGroups(): Promise<SchemaGroup[]> {
  const db = await getDb();

  const tableRows = await db.query<{ table_name: string; table_type: string }>(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY table_name
  `);

  const columnRows = await db.query<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const constraintRows = await db.query<{
    table_name: string;
    column_name: string;
    constraint_type: string;
  }>(`
    SELECT tc.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position
  `);

  const columnsByTable = new Map<string, Array<{ id: string; name: string; type: string; default: string | null; nullable: boolean; constraint: "primary-key" | "foreign-key" | "unique" | null }>>();
  for (const row of columnRows.rows) {
    const existing = columnsByTable.get(row.table_name) ?? [];
    const constraints = new Map<string, "primary-key" | "foreign-key" | "unique" | null>();
    for (const constraint of constraintRows.rows.filter((item) => item.table_name === row.table_name)) {
      if (constraint.constraint_type === "PRIMARY KEY") {
        constraints.set(constraint.column_name, "primary-key");
      } else if (constraint.constraint_type === "FOREIGN KEY") {
        constraints.set(constraint.column_name, "foreign-key");
      } else if (constraint.constraint_type === "UNIQUE") {
        constraints.set(constraint.column_name, "unique");
      }
    }

    existing.push({
      id: row.column_name,
      name: row.column_name,
      type: row.data_type,
      default: row.column_default ?? null,
      nullable: row.is_nullable === "YES",
      constraint: constraints.get(row.column_name) ?? null,
    });
    columnsByTable.set(row.table_name, existing);
  }

  const tables: SchemaTable[] = [];
  for (const row of tableRows.rows) {
    const tableName = row.table_name;
    tables.push({
      id: tableName,
      name: tableName,
      kind: row.table_type === "VIEW" ? "view" : "table",
      rowCount: 0,
      diskSizeBytes: 0,
      lastVacuumed: "—",
      updatedAt: "—",
      columns: columnsByTable.get(tableName) ?? [],
      previewRows: [],
    });
  }

  return [{ id: "public", name: "public", expanded: true, tables }];
}

export const useSqlStore = create<SqlStore>((set, get) => {
  /**
   * Pushes any debounced snapshot that's still waiting to land in `past`,
   * right now, synchronously.
   *
   * Why this matters: a debounced commit (typing a condition value) only
   * captures its "before" snapshot into `pendingSnapshot` and waits 600ms
   * before actually pushing it to `past`. If a *non-debounced* action (e.g.
   * clicking "Add condition") fires in that window, it reads
   * `get().builderState` — which already reflects the still-uncommitted
   * typing — and would push that as its own "before" snapshot. When the
   * debounce timer later fires, it'd push the *older* pending snapshot
   * *after* that newer one, leaving `past` out of chronological order and
   * making a single "undo" skip a whole step. Every commit path — debounced
   * or not — flushes any pending snapshot first, so `past` always fills in
   * the order things actually happened.
   */
  function flushPendingSnapshot() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (pendingSnapshot) {
      const snapshot = pendingSnapshot;
      pendingSnapshot = null;
      set((s) => ({ past: [...s.past, snapshot] }));
    }
  }

  /** Applies a BuilderState mutation, regenerates SQL from it (visual -> text direction), and pushes undo history. */
  function commit(updater: (prev: BuilderState) => BuilderState, options?: { debounce?: boolean }) {
    const prev = get().builderState;
    const next = updater(prev);
    const { sql, errors } = buildSqlFromState(next);

    if (options?.debounce) {
      // Coalesce a burst of rapid edits (typing) into a single undo step:
      // only capture the "before" snapshot once, at the start of the burst.
      if (!pendingSnapshot) pendingSnapshot = prev;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        flushPendingSnapshot();
      }, 600);
    } else {
      flushPendingSnapshot();
      set((s) => ({ past: [...s.past, prev], future: [] }));
    }

    set({ builderState: next, sql, errors, syncStatus: "in-sync", parseWarning: null, future: [] });
    set((s) => ({ canUndo: s.past.length > 0, canRedo: s.future.length > 0 }));
  }

  function conditionHandlers(key: "where" | "having") {
    return {
      add: () =>
        commit((prev) => {
          const condition: BuilderCondition = {
            id: nextBuilderId(key),
            instanceId: prev.tables[0]?.instanceId ?? "",
            columnId: "",
            operator: "=",
            value: "",
            connector: "AND",
          };
          return { ...prev, [key]: [...prev[key], condition] };
        }),
      update: (id: string, patch: Partial<BuilderCondition>) =>
        commit(
          (prev) => ({ ...prev, [key]: prev[key].map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
          { debounce: "value" in patch }
        ),
      remove: (id: string) => commit((prev) => ({ ...prev, [key]: prev[key].filter((c) => c.id !== id) })),
    };
  }
  const whereHandlers = conditionHandlers("where");
  const havingHandlers = conditionHandlers("having");

  const initial = createEmptyBuilderState();
  const initialCompiled = buildSqlFromState(initial);

  return {
    builderState: initial,
    past: [],
    future: [],
    sql: initialCompiled.sql,
    errors: initialCompiled.errors,
    syncStatus: "in-sync",
    parseWarning: null,
    canUndo: false,
    canRedo: false,

    undo: () => {
      // If the user hits Undo mid-keystroke (before a debounced edit has
      // settled into `past`), flush it first — otherwise this pop operates
      // on an incomplete history and skips straight past the in-progress
      // edit instead of cancelling just that one step.
      flushPendingSnapshot();
      const { past, builderState } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      if (!previous) return;
      const { sql, errors } = buildSqlFromState(previous);
      set((s) => ({
        past: s.past.slice(0, -1),
        future: [builderState, ...s.future],
        builderState: previous,
        sql,
        errors,
        syncStatus: "in-sync",
        parseWarning: null,
      }));
      set((s) => ({ canUndo: s.past.length > 0, canRedo: s.future.length > 0 }));
    },
    redo: () => {
      // Same reasoning as undo(): make sure any in-progress debounced edit
      // is settled into `past` before jumping to a future snapshot, so it
      // isn't silently discarded (and its now-orphaned timer doesn't fire
      // later and corrupt history that's already moved on).
      flushPendingSnapshot();
      const { future, builderState } = get();
      if (future.length === 0) return;
      const nextState = future[0];
      if (!nextState) return;
      const { sql, errors } = buildSqlFromState(nextState);
      set((s) => ({
        future: s.future.slice(1),
        past: [...s.past, builderState],
        builderState: nextState,
        sql,
        errors,
        syncStatus: "in-sync",
        parseWarning: null,
      }));
      set((s) => ({ canUndo: s.past.length > 0, canRedo: s.future.length > 0 }));
    },

    addTable: (table) =>
      commit((prev) => {
        const alias = generateAlias(prev.tables.map((t) => t.alias), table.name);
        return { ...prev, tables: [...prev.tables, { instanceId: nextBuilderId("tbl"), tableId: table.id, alias }] };
      }),
    addTableById: (tableId) => {
      const table = findTableById(tableId);
      if (table) get().addTable(table);
    },
    removeTable: (instanceId) =>
      commit((prev) => ({
        tables: prev.tables.filter((t) => t.instanceId !== instanceId),
        columns: prev.columns.filter((c) => c.instanceId !== instanceId),
        joins: prev.joins.filter((j) => j.leftInstanceId !== instanceId && j.rightInstanceId !== instanceId),
        where: prev.where.filter((c) => c.instanceId !== instanceId),
        groupBy: prev.groupBy.filter((g) => g.instanceId !== instanceId),
        having: prev.having.filter((c) => c.instanceId !== instanceId),
        orderBy: prev.orderBy.filter((o) => o.instanceId !== instanceId),
        limit: prev.limit,
      })),
    setAlias: (instanceId, alias) =>
      commit((prev) => ({ ...prev, tables: prev.tables.map((t) => (t.instanceId === instanceId ? { ...t, alias } : t)) }), {
        debounce: true,
      }),

    toggleColumn: (instanceId, columnId) =>
      commit((prev) => {
        const exists = prev.columns.find((c) => c.instanceId === instanceId && c.columnId === columnId);
        if (exists) return { ...prev, columns: prev.columns.filter((c) => c.id !== exists.id) };
        return { ...prev, columns: [...prev.columns, { id: nextBuilderId("col"), instanceId, columnId, aggregate: "NONE" as AggregateFn }] };
      }),
    setAggregate: (columnEntryId, aggregate) =>
      commit((prev) => ({ ...prev, columns: prev.columns.map((c) => (c.id === columnEntryId ? { ...c, aggregate } : c)) })),

    addSuggestedJoin: (suggestion) =>
      commit((prev) => ({ ...prev, joins: [...prev.joins, { id: nextBuilderId("join"), type: "INNER", ...suggestion }] })),
    addJoin: () =>
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
      }),
    updateJoin: (id, patch) => commit((prev) => ({ ...prev, joins: prev.joins.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
    removeJoin: (id) => commit((prev) => ({ ...prev, joins: prev.joins.filter((j) => j.id !== id) })),

    addWhere: whereHandlers.add,
    updateWhere: whereHandlers.update,
    removeWhere: whereHandlers.remove,
    addHaving: havingHandlers.add,
    updateHaving: havingHandlers.update,
    removeHaving: havingHandlers.remove,

    addGroupBy: () =>
      commit((prev) => ({
        ...prev,
        groupBy: [...prev.groupBy, { id: nextBuilderId("grp"), instanceId: prev.tables[0]?.instanceId ?? "", columnId: "" }],
      })),
    updateGroupBy: (id, patch) => commit((prev) => ({ ...prev, groupBy: prev.groupBy.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
    removeGroupBy: (id) => commit((prev) => ({ ...prev, groupBy: prev.groupBy.filter((g) => g.id !== id) })),

    addOrderBy: () =>
      commit((prev) => ({
        ...prev,
        orderBy: [...prev.orderBy, { id: nextBuilderId("ord"), instanceId: prev.tables[0]?.instanceId ?? "", columnId: "", direction: "ASC" }],
      })),
    updateOrderBy: (id, patch) => commit((prev) => ({ ...prev, orderBy: prev.orderBy.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
    removeOrderBy: (id) => commit((prev) => ({ ...prev, orderBy: prev.orderBy.filter((o) => o.id !== id) })),
    reorderOrderBy: (fromIndex, toIndex) =>
      commit((prev) => {
        const next = [...prev.orderBy];
        const [moved] = next.splice(fromIndex, 1);
        if (!moved) return prev;
        next.splice(toIndex, 0, moved);
        return { ...prev, orderBy: next };
      }),

    setLimit: (value) => {
      const parsed = value === "" ? null : Math.max(0, parseInt(value, 10) || 0);
      commit((prev) => ({ ...prev, limit: parsed }), { debounce: true });
    },

    setSqlText: (text) => {
      // Update the visible text immediately so typing feels responsive —
      // only the (debounced, async) canvas re-sync waits.
      set({ sql: text });

      sqlTextParseToken += 1;
      const myToken = sqlTextParseToken;

      if (sqlTextDebounceTimer) clearTimeout(sqlTextDebounceTimer);
      sqlTextDebounceTimer = setTimeout(async () => {
        const { state, warning } = await parseSqlToBuilderState(text);
        // The user may have kept typing (or undone/redone) while this was
        // in flight — if a newer call has since started, drop this result.
        if (myToken !== sqlTextParseToken) return;

        const currentBuilderState = get().builderState;
        const { errors } = buildSqlFromState(currentBuilderState);

        if (state) {
          // Parsed cleanly — the canvas adopts this as its new state, same as any visual edit.
          flushPendingSnapshot();
          set((s) => ({ past: [...s.past, s.builderState], future: [] }));
          const compiled = buildSqlFromState(state);
          set({ builderState: state, errors: compiled.errors, syncStatus: "in-sync", parseWarning: null });
        } else {
          // Can't map this text onto the canvas — keep the last-known-good visual state, flag it as stale.
          set({ errors, syncStatus: "manual-edit", parseWarning: warning });
        }
        set((s) => ({ canUndo: s.past.length > 0, canRedo: s.future.length > 0 }));
      }, 350);
    },

    reset: () => {
      const empty = createEmptyBuilderState();
      const compiled = buildSqlFromState(empty);
      pendingSnapshot = null;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (sqlTextDebounceTimer) clearTimeout(sqlTextDebounceTimer);
      sqlTextParseToken += 1; // invalidate any in-flight parse
      set({
        builderState: empty,
        past: [],
        future: [],
        sql: compiled.sql,
        errors: compiled.errors,
        syncStatus: "in-sync",
        parseWarning: null,
        canUndo: false,
        canRedo: false,
      });
    },

    isDbReady: false,
    isDbInitializing: false,
    isExecuting: false,
    activeTemplateId: null,
    queryResult: null,
    schemaGroups: SCHEMA_GROUPS,
    schemaLoading: true,
    schemaError: null,

    initDb: async () => {
      // `isDbInitializing` flips to true synchronously, below, before the
      // first `await` — so a second call arriving on the very next tick
      // (React 18 Strict Mode invokes mount effects twice) sees it already
      // set and bails out here instead of racing this one.
      if (get().isDbReady || get().isDbInitializing) return;
      set({ isDbInitializing: true });
      try {
        const db = await getDb();
        if (!get().activeTemplateId) {
          // First boot in this session: seed the default curriculum template
          // right away instead of leaving an empty public schema. Without
          // this, a student typing `SELECT * FROM students;` before ever
          // touching the schema switcher hits a real (but confusing)
          // "relation does not exist" error. A later remount that already
          // has a template loaded — e.g. navigating Builder -> Editor —
          // skips straight past this block.
          await resetPublicSchema(db);
          await db.exec(DB_TEMPLATES[DEFAULT_TEMPLATE_ID].sql);
          set({ activeTemplateId: DEFAULT_TEMPLATE_ID });
        }
        set({ isDbReady: true });
        await get().refreshSchema();
      } catch (err) {
        // Covers a WASM boot failure and a (should-be-impossible, since this
        // template is verified end-to-end) seed failure alike. Either way
        // isDbReady still flips true so the boot overlay clears and the
        // student sees the real error below instead of a spinner that never
        // resolves.
        set({ queryResult: toErrorResult(err, 0), isDbReady: true });
      } finally {
        set({ isDbInitializing: false });
      }
    },

    executeSql: async (sqlText) => {
      const text = (sqlText ?? get().sql).trim();
      if (!text || get().isExecuting) return null;

      set({ isExecuting: true });
      const start = performance.now();
      try {
        const db = await getDb();
        set({ isDbReady: true });
        const guardedText = await applyLimitGuard(text);
        // exec(), not query(): query() uses Postgres's extended protocol,
        // which rejects more than one statement per call ("cannot insert
        // multiple commands into a prepared statement") — verified directly
        // against PGlite. A script editor has to allow a student pasting in
        // `CREATE TABLE ...; INSERT ...; SELECT ...;` as one run, so exec()
        // (simple protocol, multi-statement) is the correct call here; it's
        // why resultsToQueryResult below takes an array, one entry per
        // statement, and shows the last one that produced rows.
        const results = await db.exec(guardedText);
        const executionMs = Math.round(performance.now() - start);
        const queryResult = resultsToQueryResult(results, executionMs);
        set({ queryResult, isExecuting: false });
        if (/\b(CREATE|ALTER|DROP)\s+(TABLE|VIEW)\b/i.test(text)) {
          await get().refreshSchema();
        }
        return queryResult;
      } catch (err) {
        const executionMs = Math.round(performance.now() - start);
        const queryResult = toErrorResult(err, executionMs);
        set({ queryResult, isExecuting: false });
        return queryResult;
      }
    },

    loadTemplate: async (name) => {
      const template = DB_TEMPLATES[name];
      if (!template) return;

      set({ isDbInitializing: true });
      try {
        const db = await getDb();
        await resetPublicSchema(db);
        await db.exec(template.sql);
        set({ isDbReady: true, activeTemplateId: name, queryResult: null });
        await get().refreshSchema();
      } catch (err) {
        // Both templates are verified end-to-end against a real PGlite
        // instance, so this branch should only fire from something
        // unexpected (e.g. the WASM asset failing to load) — surface it the
        // same way a bad query would rather than failing silently.
        set({ queryResult: toErrorResult(err, 0) });
      } finally {
        set({ isDbInitializing: false });
      }
    },

    refreshSchema: async () => {
      if (get().schemaLoading) return;

      set({ schemaLoading: true, schemaError: null });
      try {
        const nextGroups = await getLiveSchemaGroups();
        set({ schemaGroups: nextGroups, schemaLoading: false, schemaError: null });
      } catch (err) {
        console.error("[/lib/useSqlStore] failed to refresh schema", err);
        set({ schemaGroups: SCHEMA_GROUPS, schemaLoading: false, schemaError: err instanceof Error ? err.message : "Unknown schema error" });
      }
    },
  };
});
