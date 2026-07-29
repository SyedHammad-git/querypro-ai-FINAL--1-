import { findTableByName } from "@/components/schema/SchemaTree";
import { nextBuilderId } from "@/lib/sql-builder";
import type {
  AggregateFn,
  BuilderCondition,
  BuilderGroupByField,
  BuilderJoin,
  BuilderOrderBy,
  BuilderSelectedColumn,
  BuilderState,
  BuilderTableInstance,
  ConditionOperator,
  JoinType,
  LogicalConnector,
} from "@/lib/types";

// node-sql-parser doesn't ship precise TypeScript types for its AST (its
// public types are a thin, loosely-typed shell over the real parser
// output) — so rather than sprinkling `any` through every function
// signature below, it's isolated to this one named alias. Everything past
// this line reads as "AstNode", not "any", even though structurally it's
// the same looseness.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstNode = any;

const CONDITION_OPERATORS: ConditionOperator[] = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "IN", "IS NULL", "IS NOT NULL"];
const AGGREGATE_NAMES: AggregateFn[] = ["COUNT", "SUM", "AVG", "MIN", "MAX"];

export interface ParseResult {
  state: BuilderState | null;
  /** Human-readable reason the SQL couldn't be mapped onto the visual canvas. Null on success. */
  warning: string | null;
}

/** Thrown internally to bail out of the recursive walk the moment we hit something the visual builder can't represent. */
class UnsupportedSqlError extends Error {}

/**
 * Best-effort reverse compiler: raw SQL text -> BuilderState.
 *
 * This is intentionally scoped to the exact subset of SELECT that
 * `buildSqlFromState` can produce (single FROM table + JOINs, a flat chain
 * of AND/OR WHERE/HAVING comparisons, GROUP BY, ORDER BY, LIMIT). Anything
 * outside that — subqueries, CTEs, window functions, multiple statements,
 * non-SELECT statements, computed expressions — is rejected with a clear
 * warning rather than silently producing a wrong or partial canvas. That's
 * a deliberate trade-off: a fabricated visual state is worse than an
 * honest "can't visualize this" badge.
 *
 * `node-sql-parser` is a genuinely heavy dependency (~500KB), so it's
 * dynamically imported here rather than at module scope — Next.js code-splits
 * it into its own chunk, fetched once on first use instead of bloating every
 * page's initial bundle.
 */
export async function parseSqlToBuilderState(sql: string): Promise<ParseResult> {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { state: emptyState(), warning: null };
  }

  const { Parser } = await import("node-sql-parser");
  const parser = new Parser();

  let ast;
  try {
    ast = parser.astify(trimmed, { database: "mysql" });
  } catch {
    return { state: null, warning: "SQL has a syntax error, so it can't be parsed onto the canvas yet." };
  }

  const stmt = Array.isArray(ast) ? ast[0] : ast;
  if (Array.isArray(ast) && ast.length > 1) {
    return { state: null, warning: "Multiple statements detected — only a single SELECT can be visualized." };
  }
  if (!stmt || stmt.type !== "select") {
    return { state: null, warning: "Only SELECT statements can be shown on the visual canvas." };
  }

  try {
    const state = mapSelectToState(stmt);
    return { state, warning: null };
  } catch (err) {
    const message = err instanceof UnsupportedSqlError ? err.message : "This query uses SQL the visual canvas can't represent yet.";
    return { state: null, warning: message };
  }
}

function emptyState(): BuilderState {
  return { tables: [], columns: [], joins: [], where: [], groupBy: [], having: [], orderBy: [], limit: 100 };
}

function mapSelectToState(stmt: AstNode): BuilderState {
  if (!Array.isArray(stmt.from) || stmt.from.length === 0) {
    throw new UnsupportedSqlError("Add a FROM table before this can be visualized.");
  }
  if (stmt.from.some((f: AstNode) => !f.table)) {
    throw new UnsupportedSqlError("Subqueries in FROM aren't supported by the visual canvas.");
  }

  // --- FROM + JOINs -> tables, alias -> instanceId map ---
  const tables: BuilderTableInstance[] = [];
  const aliasToInstance = new Map<string, string>();
  const joins: BuilderJoin[] = [];

  stmt.from.forEach((f: AstNode, index: number) => {
    const schemaTable = findTableByName(f.table);
    if (!schemaTable) {
      throw new UnsupportedSqlError(`Table "${f.table}" isn't in the connected schema.`);
    }
    const instanceId = nextBuilderId("tbl");
    const alias = f.as || f.table;
    tables.push({ instanceId, tableId: schemaTable.id, alias });
    aliasToInstance.set(alias.toLowerCase(), instanceId);
    aliasToInstance.set(f.table.toLowerCase(), instanceId);

    if (index > 0) {
      if (!f.join) throw new UnsupportedSqlError("Only comma-free, explicit JOIN syntax is supported.");
      const type = f.join.replace(/\s*JOIN$/i, "").toUpperCase() as JoinType;
      if (!["INNER", "LEFT", "RIGHT", "FULL"].includes(type)) {
        throw new UnsupportedSqlError(`Unsupported join type "${f.join}".`);
      }
      if (!f.on || f.on.type !== "binary_expr" || f.on.operator !== "=") {
        throw new UnsupportedSqlError("Joins must use a simple ON a.col = b.col condition.");
      }
      const left = resolveColumnRef(f.on.left, aliasToInstance);
      const right = resolveColumnRef(f.on.right, aliasToInstance);
      joins.push({ id: nextBuilderId("join"), leftInstanceId: left.instanceId, leftColumnId: left.column, rightInstanceId: right.instanceId, rightColumnId: right.column, type });
    }
  });

  // --- SELECT columns ---
  const columns: BuilderSelectedColumn[] = [];
  const selectList = stmt.columns;
  const isStarOnly = selectList === "*" || (Array.isArray(selectList) && selectList.length === 1 && selectList[0]?.expr?.type === "star");
  if (!isStarOnly && Array.isArray(selectList)) {
    for (const col of selectList) {
      const expr = col.expr;
      if (expr.type === "column_ref") {
        const { instanceId, column } = resolveColumnRef(expr, aliasToInstance);
        columns.push({ id: nextBuilderId("col"), instanceId, columnId: column, aggregate: "NONE" });
      } else if (expr.type === "aggr_func" && AGGREGATE_NAMES.includes(expr.name as AggregateFn)) {
        const inner = expr.args?.expr;
        if (inner?.type === "star") {
          // COUNT(*) — represented as an empty selection, matching buildSqlFromState's own convention.
          continue;
        }
        if (inner?.type !== "column_ref") throw new UnsupportedSqlError("Aggregate functions must wrap a plain column.");
        const { instanceId, column } = resolveColumnRef(inner, aliasToInstance);
        columns.push({ id: nextBuilderId("col"), instanceId, columnId: column, aggregate: expr.name as AggregateFn });
      } else {
        throw new UnsupportedSqlError("Computed SELECT expressions aren't supported by the visual canvas yet.");
      }
    }
  }

  const where = stmt.where ? flattenConditions(stmt.where, aliasToInstance, "where") : [];
  const having = stmt.having ? flattenConditions(stmt.having, aliasToInstance, "having") : [];

  // --- GROUP BY (library wraps this differently across versions) ---
  const groupByCols = Array.isArray(stmt.groupby) ? stmt.groupby : stmt.groupby?.columns ?? [];
  const groupBy: BuilderGroupByField[] = groupByCols.map((g: AstNode) => {
    const { instanceId, column } = resolveColumnRef(g, aliasToInstance);
    return { id: nextBuilderId("grp"), instanceId, columnId: column };
  });

  // --- ORDER BY ---
  const orderBy: BuilderOrderBy[] = (stmt.orderby ?? []).map((o: AstNode) => {
    if (o.expr.type !== "column_ref") throw new UnsupportedSqlError("ORDER BY must reference a plain column.");
    const { instanceId, column } = resolveColumnRef(o.expr, aliasToInstance);
    return { id: nextBuilderId("ord"), instanceId, columnId: column, direction: (o.type ?? "ASC") as "ASC" | "DESC" };
  });

  // --- LIMIT ---
  const limitValue = stmt.limit?.value?.[0]?.value;
  const limit = typeof limitValue === "number" ? limitValue : null;

  return { tables, columns, joins, where, groupBy, having, orderBy, limit };
}

function resolveColumnRef(node: AstNode, aliasToInstance: Map<string, string>): { instanceId: string; column: string } {
  if (!node || node.type !== "column_ref") throw new UnsupportedSqlError("Expected a plain column reference.");
  const tableKey = (node.table ?? "").toLowerCase();
  let instanceId = aliasToInstance.get(tableKey);
  if (!instanceId && !node.table && aliasToInstance.size === 1) {
    // Unqualified column with exactly one table in scope — safe to assume it belongs there.
    instanceId = [...aliasToInstance.values()][0];
  }
  if (!instanceId) {
    throw new UnsupportedSqlError(
      node.table ? `Column references an unknown table alias "${node.table}".` : "Unqualified columns need a table alias when more than one table is joined."
    );
  }
  return { instanceId, column: node.column };
}

function flattenConditions(node: AstNode, aliasToInstance: Map<string, string>, kind: "where" | "having"): BuilderCondition[] {
  const acc: BuilderCondition[] = [];

  function walk(n: AstNode, connector: LogicalConnector) {
    if (n?.type === "binary_expr" && (n.operator === "AND" || n.operator === "OR")) {
      walk(n.left, connector);
      walk(n.right, n.operator);
      return;
    }
    acc.push(toLeafCondition(n, connector, aliasToInstance, kind));
  }

  walk(node, "AND");
  return acc;
}

function toLeafCondition(node: AstNode, connector: LogicalConnector, aliasToInstance: Map<string, string>, kind: "where" | "having"): BuilderCondition {
  if (!node || node.type !== "binary_expr") {
    throw new UnsupportedSqlError(`This ${kind.toUpperCase()} clause has a condition the visual canvas can't represent.`);
  }

  // HAVING commonly wraps an aggregate on the left (e.g. COUNT(o.id) > 2) — resolve through it.
  const leftNode = node.left?.type === "aggr_func" ? node.left.args?.expr : node.left;
  const { instanceId, column } = resolveColumnRef(leftNode, aliasToInstance);

  let operator: ConditionOperator;
  let value = "";

  if (node.operator === "IS" && node.right?.type === "null") {
    operator = "IS NULL";
  } else if (node.operator === "IS NOT" && node.right?.type === "null") {
    operator = "IS NOT NULL";
  } else if (node.operator === "IN" && node.right?.type === "expr_list") {
    operator = "IN";
    value = node.right.value.map((v: AstNode) => String(v.value)).join(", ");
  } else if (CONDITION_OPERATORS.includes(node.operator)) {
    operator = node.operator as ConditionOperator;
    value = String(node.right?.value ?? "");
  } else {
    throw new UnsupportedSqlError(`Operator "${node.operator}" isn't supported by the visual condition builder.`);
  }

  return { id: nextBuilderId(kind === "where" ? "where" : "having"), instanceId, columnId: column, operator, value, connector };
}
