import { findTableById } from "@/components/schema/SchemaTree";
import type {
  BuilderCondition,
  BuilderState,
  BuilderTableInstance,
} from "./types";

/** Resolves a builder table instance back to its schema definition, or null if it's been removed. */
function resolveTable(instance: BuilderTableInstance) {
  return findTableById(instance.tableId) ?? null;
}

function findInstance(state: BuilderState, instanceId: string) {
  return state.tables.find((t) => t.instanceId === instanceId);
}

function columnRef(state: BuilderState, instanceId: string, columnId: string): string {
  const instance = findInstance(state, instanceId);
  return `${instance?.alias ?? instanceId}.${columnId}`;
}

function formatConditionValue(operator: string, value: string): string {
  if (operator === "IS NULL" || operator === "IS NOT NULL") return "";
  const trimmed = value.trim();
  const isNumeric = trimmed !== "" && !Number.isNaN(Number(trimmed));
  if (operator === "IN") {
    // Accept comma-separated values, quoting each unless it's numeric.
    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    const formatted = parts.map((p) => (Number.isNaN(Number(p)) ? `'${p}'` : p));
    return ` (${formatted.join(", ")})`;
  }
  return ` ${isNumeric ? trimmed : `'${trimmed}'`}`;
}

function buildConditionClause(conditions: BuilderCondition[], state: BuilderState): string {
  return conditions
    .map((cond, index) => {
      const prefix = index === 0 ? "" : `${cond.connector} `;
      const ref = columnRef(state, cond.instanceId, cond.columnId);
      const valuePart = formatConditionValue(cond.operator, cond.value);
      return `${prefix}${ref} ${cond.operator}${valuePart}`;
    })
    .join("\n  ");
}

export interface BuiltQuery {
  sql: string;
  errors: string[];
}

/**
 * Compiles the current builder state into formatted SQL, alongside a list
 * of human-readable validation errors. Generation is best-effort even with
 * errors present — the caller decides whether to block Run/Export on them.
 */
export function buildSqlFromState(state: BuilderState): BuiltQuery {
  const errors: string[] = [];

  if (state.tables.length === 0) {
    errors.push("Add at least one table to begin building a query.");
    return { sql: "-- Drag a table from the palette to get started.", errors };
  }

  const missingTables = state.tables.filter((t) => !resolveTable(t));
  if (missingTables.length > 0) {
    errors.push("One or more tables on the canvas could not be resolved.");
  }

  if (state.columns.length === 0) {
    errors.push("Select at least one column, or use COUNT(*) to count rows.");
  }

  state.joins.forEach((join) => {
    if (!findInstance(state, join.leftInstanceId) || !findInstance(state, join.rightInstanceId)) {
      errors.push("A join references a table that's no longer on the canvas.");
    }
  });

  state.where.forEach((cond) => {
    if (cond.operator !== "IS NULL" && cond.operator !== "IS NOT NULL" && !cond.value.trim()) {
      errors.push(`WHERE condition on "${cond.columnId}" is missing a value.`);
    }
  });

  state.having.forEach((cond) => {
    if (cond.operator !== "IS NULL" && cond.operator !== "IS NOT NULL" && !cond.value.trim()) {
      errors.push(`HAVING condition on "${cond.columnId}" is missing a value.`);
    }
  });

  if (state.having.length > 0 && state.groupBy.length === 0) {
    errors.push("HAVING requires at least one GROUP BY field.");
  }

  // --- SELECT ---
  const selectParts =
    state.columns.length === 0
      ? ["COUNT(*) AS total"]
      : state.columns.map((col) => {
          const ref = columnRef(state, col.instanceId, col.columnId);
          if (col.aggregate === "NONE") return ref;
          const alias = `${col.aggregate.toLowerCase()}_${col.columnId}`;
          return `${col.aggregate}(${ref}) AS ${alias}`;
        });

  const primary = state.tables[0];
  if (!primary) {
    errors.push("Add at least one table to begin building a query.");
    return { sql: "-- Drag a table from the palette to get started.", errors };
  }
  const primaryTable = resolveTable(primary);
  const lines: string[] = [];

  lines.push(`SELECT\n  ${selectParts.join(",\n  ")}`);
  lines.push(`FROM ${primaryTable?.name ?? primary.tableId} ${primary.alias}`);

  // --- JOINs ---
  state.joins.forEach((join) => {
    const rightInstance = findInstance(state, join.rightInstanceId);
    const rightTable = rightInstance ? resolveTable(rightInstance) : null;
    if (!rightInstance || !rightTable) return;
    const leftRef = columnRef(state, join.leftInstanceId, join.leftColumnId);
    const rightRef = columnRef(state, join.rightInstanceId, join.rightColumnId);
    lines.push(
      `${join.type} JOIN ${rightTable.name} ${rightInstance.alias} ON ${leftRef} = ${rightRef}`
    );
  });

  // --- WHERE ---
  if (state.where.length > 0) {
    lines.push(`WHERE ${buildConditionClause(state.where, state)}`);
  }

  // --- GROUP BY ---
  if (state.groupBy.length > 0) {
    const groupRefs = state.groupBy.map((g) => columnRef(state, g.instanceId, g.columnId));
    lines.push(`GROUP BY ${groupRefs.join(", ")}`);
  }

  // --- HAVING ---
  if (state.having.length > 0) {
    lines.push(`HAVING ${buildConditionClause(state.having, state)}`);
  }

  // --- ORDER BY ---
  if (state.orderBy.length > 0) {
    const orderRefs = state.orderBy.map(
      (o) => `${columnRef(state, o.instanceId, o.columnId)} ${o.direction}`
    );
    lines.push(`ORDER BY ${orderRefs.join(", ")}`);
  }

  // --- LIMIT ---
  if (state.limit !== null && state.limit > 0) {
    lines.push(`LIMIT ${state.limit}`);
  }

  return { sql: `${lines.join("\n")};`, errors };
}

export function createEmptyBuilderState(): BuilderState {
  return {
    tables: [],
    columns: [],
    joins: [],
    where: [],
    groupBy: [],
    having: [],
    orderBy: [],
    limit: 100,
  };
}

let idCounter = 0;
/** Deterministic-enough id generator for builder entities (avoids extra deps). */
export function nextBuilderId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
