// ---------------------------------------------------------------------------
// Schema domain
// ---------------------------------------------------------------------------

export type ColumnConstraint = "primary-key" | "foreign-key" | "unique" | null;

export interface SchemaColumn {
  id: string;
  name: string;
  type: string;
  default: string | null;
  nullable: boolean;
  constraint: ColumnConstraint;
  referencedTable?: string;
}

export interface SchemaTable {
  id: string;
  name: string;
  kind: "table" | "view" | "procedure";
  rowCount: number;
  diskSizeBytes: number;
  lastVacuumed: string;
  updatedAt: string;
  isPrimary?: boolean;
  columns: SchemaColumn[];
  previewRows: Record<string, string>[];
}

export interface SchemaGroup {
  id: string;
  name: string;
  expanded: boolean;
  tables: SchemaTable[];
}

// ---------------------------------------------------------------------------
// Chat / AI assistant domain
// ---------------------------------------------------------------------------

export type ChatRole = "assistant" | "user";

export interface ChatSuggestion {
  id: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  sql?: string;
  suggestions?: ChatSuggestion[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Query execution / results domain
// ---------------------------------------------------------------------------

export type QueryStatus = "success" | "error" | "running";

export interface QueryResultColumn {
  key: string;
  label: string;
}

export interface QueryResult {
  columns: QueryResultColumn[];
  rows: Record<string, string>[];
  executionMs: number;
  rowCount: number;
  status: QueryStatus;
  /** Populated when status === "error". The exact message Postgres raised. */
  errorMessage?: string;
  /** Postgres SQLSTATE, e.g. "42601" for a syntax error, when available. */
  errorCode?: string;
  /** Postgres's own suggested fix, when the server provides one. */
  errorHint?: string;
}

export interface QueryHistoryEntry {
  id: string;
  status: QueryStatus;
  sqlSnippet: string;
  sqlFull: string;
  database: string;
  executionMs: number | null;
  rowCount: number | null;
  timestampLabel: string;
  errorMessage?: string;
  errorLine?: string;
  isFavorite?: boolean;
}

// ---------------------------------------------------------------------------
// Navigation / workspace shell domain
// ---------------------------------------------------------------------------

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface ConnectedDatabase {
  id: string;
  name: string;
  status: "stable" | "vacuuming" | "syncing";
  icon: string;
}

export interface KeywordUsage {
  keyword: string;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Manual SQL Builder
// ---------------------------------------------------------------------------

export type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";
export type AggregateFn = "NONE" | "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
export type ConditionOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE" | "IN" | "IS NULL" | "IS NOT NULL";
export type SortDirection = "ASC" | "DESC";
export type LogicalConnector = "AND" | "OR";

/** A table instance placed on the builder canvas (a table may appear more than once, hence a separate id from tableId). */
export interface BuilderTableInstance {
  instanceId: string;
  tableId: string;
  alias: string;
}

/** A column selected for the SELECT clause, optionally aggregated. */
export interface BuilderSelectedColumn {
  id: string;
  instanceId: string;
  columnId: string;
  aggregate: AggregateFn;
}

export interface BuilderJoin {
  id: string;
  leftInstanceId: string;
  leftColumnId: string;
  rightInstanceId: string;
  rightColumnId: string;
  type: JoinType;
}

export interface BuilderCondition {
  id: string;
  instanceId: string;
  columnId: string;
  operator: ConditionOperator;
  value: string;
  connector: LogicalConnector;
}

export interface BuilderOrderBy {
  id: string;
  instanceId: string;
  columnId: string;
  direction: SortDirection;
}

export interface BuilderGroupByField {
  id: string;
  instanceId: string;
  columnId: string;
}

export interface BuilderState {
  tables: BuilderTableInstance[];
  columns: BuilderSelectedColumn[];
  joins: BuilderJoin[];
  where: BuilderCondition[];
  groupBy: BuilderGroupByField[];
  having: BuilderCondition[];
  orderBy: BuilderOrderBy[];
  limit: number | null;
}
