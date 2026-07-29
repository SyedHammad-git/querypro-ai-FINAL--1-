import type {
  ChatMessage,
  ConnectedDatabase,
  KeywordUsage,
  NavItem,
  QueryHistoryEntry,
  QueryResult,
  SchemaGroup,
} from "./types";

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/chat", label: "AI SQL Generator", icon: "bot" },
  { href: "/builder", label: "Manual SQL Builder", icon: "blocks" },
  { href: "/workspace", label: "SQL Workspace", icon: "square-terminal" },
  { href: "/editor", label: "Editor", icon: "code-2" },
  { href: "/import", label: "Batch Import", icon: "upload-cloud" },
  { href: "/schema", label: "Schema Explorer", icon: "workflow" },
  { href: "/saved", label: "Saved Queries", icon: "bookmark" },
  { href: "/history", label: "Query History", icon: "history" },
  { href: "/templates", label: "Templates", icon: "layout-template" },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/settings", label: "Profile", icon: "user-circle" },
  { href: "/help", label: "Help", icon: "help-circle" },
];

// ---------------------------------------------------------------------------
// Schema Explorer
// ---------------------------------------------------------------------------

export const SCHEMA_GROUPS: SchemaGroup[] = [
  {
    id: "public",
    name: "public",
    expanded: true,
    tables: [
      {
        id: "users",
        name: "users",
        kind: "table",
        isPrimary: true,
        rowCount: 42851,
        diskSizeBytes: 13002342,
        lastVacuumed: "2 hours ago",
        updatedAt: "2 mins ago",
        columns: [
          {
            id: "id",
            name: "id",
            type: "uuid",
            default: "uuid_generate_v4()",
            nullable: false,
            constraint: "primary-key",
          },
          {
            id: "email",
            name: "email",
            type: "varchar(255)",
            default: null,
            nullable: false,
            constraint: "unique",
          },
          {
            id: "full_name",
            name: "full_name",
            type: "text",
            default: null,
            nullable: true,
            constraint: null,
          },
          {
            id: "created_at",
            name: "created_at",
            type: "timestamp",
            default: "now()",
            nullable: false,
            constraint: null,
          },
          {
            id: "team_id",
            name: "team_id",
            type: "uuid",
            default: null,
            nullable: true,
            constraint: "foreign-key",
            referencedTable: "teams",
          },
        ],
        previewRows: [
          { id: "82f0…", email: "alex@comp…" },
          { id: "a1b2…", email: "sarah.j@…" },
          { id: "f9e8…", email: "dev@stack…" },
          { id: "33d4…", email: "mark.t@…" },
          { id: "66a1…", email: "nina@clo…" },
        ],
      },
      {
        id: "orders",
        name: "orders",
        kind: "table",
        rowCount: 118302,
        diskSizeBytes: 40213112,
        lastVacuumed: "6 hours ago",
        updatedAt: "12 mins ago",
        columns: [
          {
            id: "id",
            name: "id",
            type: "uuid",
            default: "uuid_generate_v4()",
            nullable: false,
            constraint: "primary-key",
          },
          {
            id: "user_id",
            name: "user_id",
            type: "uuid",
            default: null,
            nullable: false,
            constraint: "foreign-key",
            referencedTable: "users",
          },
          {
            id: "total_amount",
            name: "total_amount",
            type: "numeric(10,2)",
            default: "0.00",
            nullable: false,
            constraint: null,
          },
          {
            id: "status",
            name: "status",
            type: "varchar(32)",
            default: "'pending'",
            nullable: false,
            constraint: null,
          },
          {
            id: "created_at",
            name: "created_at",
            type: "timestamp",
            default: "now()",
            nullable: false,
            constraint: null,
          },
        ],
        previewRows: [
          { id: "9f2c…", user_id: "82f0…" },
          { id: "1e77…", user_id: "a1b2…" },
          { id: "bb31…", user_id: "f9e8…" },
        ],
      },
      {
        id: "order_items",
        name: "order_items",
        kind: "table",
        rowCount: 305112,
        diskSizeBytes: 61022001,
        lastVacuumed: "6 hours ago",
        updatedAt: "12 mins ago",
        columns: [
          {
            id: "id",
            name: "id",
            type: "uuid",
            default: "uuid_generate_v4()",
            nullable: false,
            constraint: "primary-key",
          },
          {
            id: "order_id",
            name: "order_id",
            type: "uuid",
            default: null,
            nullable: false,
            constraint: "foreign-key",
            referencedTable: "orders",
          },
          {
            id: "sku",
            name: "sku",
            type: "varchar(64)",
            default: null,
            nullable: false,
            constraint: null,
          },
          {
            id: "quantity",
            name: "quantity",
            type: "integer",
            default: "1",
            nullable: false,
            constraint: null,
          },
        ],
        previewRows: [],
      },
      {
        id: "inventory_items",
        name: "inventory_items",
        kind: "table",
        rowCount: 8420,
        diskSizeBytes: 2214300,
        lastVacuumed: "1 day ago",
        updatedAt: "3 hours ago",
        columns: [],
        previewRows: [],
      },
      {
        id: "active_subscriptions",
        name: "active_subscriptions",
        kind: "view",
        rowCount: 3021,
        diskSizeBytes: 0,
        lastVacuumed: "—",
        updatedAt: "—",
        columns: [],
        previewRows: [],
      },
      {
        id: "calculate_tax",
        name: "calculate_tax()",
        kind: "procedure",
        rowCount: 0,
        diskSizeBytes: 0,
        lastVacuumed: "—",
        updatedAt: "—",
        columns: [],
        previewRows: [],
      },
    ],
  },
  {
    id: "auth",
    name: "auth",
    expanded: false,
    tables: [],
  },
  {
    id: "extensions",
    name: "extensions",
    expanded: false,
    tables: [],
  },
];

// ---------------------------------------------------------------------------
// AI Chatbot
// ---------------------------------------------------------------------------

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    text: "Hello! I'm your QueryPro assistant. I've analyzed your schema for `production_db`. How can I help you build a query today?",
    timestamp: "9:41 AM",
    suggestions: [
      { id: "s1", label: "Show monthly revenue by product" },
      { id: "s2", label: "Find top 10 users by order count" },
      { id: "s3", label: "Audit log for table 'users'" },
    ],
  },
  {
    id: "msg-2",
    role: "user",
    text: "Give me a list of all users who signed up in the last 30 days and have spent more than $500 in total.",
    timestamp: "9:42 AM",
  },
  {
    id: "msg-3",
    role: "assistant",
    text: "I'll join the `users` and `orders` tables, filter by `created_at` date, and aggregate the `total_amount` per user.",
    sql: `SELECT
  u.id,
  u.full_name,
  SUM(o.total_amount) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name
HAVING SUM(o.total_amount) > 500
ORDER BY total_spent DESC;`,
    timestamp: "9:42 AM",
  },
];

export const CHAT_CONTEXT_TABLES = ["users", "orders", "order_items"];

// ---------------------------------------------------------------------------
// SQL Workspace / Dashboard — live editor + results
// ---------------------------------------------------------------------------

export const LIVE_SQL_SNIPPET = `CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();`;

// ---------------------------------------------------------------------------
// Editor (multi-tab SQL Studio)
// ---------------------------------------------------------------------------

export interface EditorTab {
  id: string;
  name: string;
  sql: string;
  dirty?: boolean;
}

export const EDITOR_TABS: EditorTab[] = [
  {
    id: "tab-1",
    name: "query_1.sql",
    sql: `CREATE DATABASE student;
SHOW DATABASES;
USE student;

CREATE TABLE emp (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  salary DOUBLE,
  job VARCHAR(50)
);

INSERT INTO emp VALUES (1, "Hammad", 25000, "clerk");
SELECT * FROM emp;

INSERT INTO emp VALUES
  (2, "Ali", 25000, "clerk"),
  (3, "Hamza", 30000, "salesman"),
  (4, "Hassan", 40000, "manager");

SELECT * FROM emp;
-- New query here`,
  },
  {
    id: "tab-2",
    name: "sql_file_2.sql",
    sql: `SELECT department, ROUND(AVG(salary), 2) AS avg_salary, COUNT(*) AS headcount
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,
  },
  {
    id: "tab-3",
    name: "setup.sql",
    sql: `-- One-time environment setup
CREATE SCHEMA IF NOT EXISTS analytics;
GRANT USAGE ON SCHEMA analytics TO reporting_role;`,
  },
];

export interface EditorLogEntry {
  id: string;
  time: string;
  action: string;
  message: string;
  duration: string;
  status: "success" | "error";
}

export const EDITOR_QUERY_LOG: EditorLogEntry[] = [
  { id: "log-1", time: "01:00:12", action: "INSERT INTO emp VALUES...", message: "3 row(s) affected", duration: "0.015 sec", status: "success" },
  { id: "log-2", time: "01:00:10", action: "SELECT * FROM emp", message: "1 row(s) returned", duration: "0.001 sec", status: "success" },
  { id: "log-3", time: "01:00:05", action: "CREATE TABLE emp...", message: "0 row(s) affected", duration: "0.047 sec", status: "success" },
  { id: "log-4", time: "01:00:01", action: "USE student", message: "Database changed", duration: "0.000 sec", status: "success" },
];

export const LIVE_QUERY_RESULT: QueryResult = {
  status: "success",
  executionMs: 12,
  rowCount: 3,
  columns: [
    { key: "index", label: "#" },
    { key: "id", label: "ID (UUID)" },
    { key: "email", label: "EMAIL" },
    { key: "created_at", label: "CREATED_AT" },
    { key: "status", label: "STATUS" },
  ],
  rows: [
    {
      index: "1",
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      email: "alex.dev@querypro.ai",
      created_at: "2023-10-24 14:20:01",
      status: "verified",
    },
    {
      index: "2",
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "support@dbms.com",
      created_at: "2023-10-24 14:25:30",
      status: "verified",
    },
    {
      index: "3",
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      email: "admin_root@cloud.net",
      created_at: "2023-10-24 14:30:15",
      status: "pending",
    },
  ],
};

// ---------------------------------------------------------------------------
// Query History
// ---------------------------------------------------------------------------

export const QUERY_HISTORY: QueryHistoryEntry[] = [
  {
    id: "q-1",
    status: "success",
    sqlSnippet: "SELECT * FROM users WHERE active = true ORDER BY...",
    sqlFull: `SELECT * FROM users
WHERE active = true
AND created_at > '2023-01-01'
ORDER BY last_login DESC
LIMIT 100;`,
    database: "PostgreSQL",
    executionMs: 45,
    rowCount: 1240,
    timestampLabel: "2 mins ago",
  },
  {
    id: "q-2",
    status: "error",
    sqlSnippet: "UPDATE orders SET status = 'shipped' WHERE id IN (SELEC...",
    sqlFull: `UPDATE orders SET status = 'shipped' WHERE id IN (SELEC...);`,
    database: "PostgreSQL",
    executionMs: 1200,
    rowCount: null,
    timestampLabel: "15 mins ago",
    errorMessage: 'Error: column "selec" does not exist',
    errorLine: 'LINE 1: ...UPDATE orders SET status = \'shipped\' WHERE id IN (SELEC...',
  },
  {
    id: "q-3",
    status: "success",
    sqlSnippet: "INSERT INTO audit_logs (event_type, description, user_id)...",
    sqlFull: `INSERT INTO audit_logs (event_type, description, user_id)
VALUES ('LOGIN', 'User successfully logged in via OAuth', 542);`,
    database: "PostgreSQL",
    executionMs: 12,
    rowCount: 1,
    timestampLabel: "45 mins ago",
  },
  {
    id: "q-4",
    status: "success",
    sqlSnippet: "SELECT product_id, SUM(quantity) FROM order_items GROUP...",
    sqlFull: `SELECT product_id, SUM(quantity) AS units_sold
FROM order_items
GROUP BY product_id
ORDER BY units_sold DESC
LIMIT 20;`,
    database: "PostgreSQL",
    executionMs: 210,
    rowCount: 20,
    timestampLabel: "1 hour ago",
    isFavorite: true,
  },
  {
    id: "q-5",
    status: "success",
    sqlSnippet: "DELETE FROM sessions WHERE expires_at < NOW();",
    sqlFull: `DELETE FROM sessions WHERE expires_at < NOW();`,
    database: "PostgreSQL",
    executionMs: 34,
    rowCount: 892,
    timestampLabel: "3 hours ago",
  },
];

export const KEYWORD_USAGE: KeywordUsage[] = [
  { keyword: "SELECT", percentage: 85 },
  { keyword: "JOIN", percentage: 42 },
  { keyword: "UPDATE", percentage: 12 },
  { keyword: "DELETE", percentage: 4 },
];

export const CONNECTED_DATABASES: ConnectedDatabase[] = [
  { id: "prod-v2", name: "production_v2", status: "stable", icon: "database" },
  { id: "staging-logs", name: "staging_logs", status: "vacuuming", icon: "server" },
];

export const RECENT_PROJECTS = [
  { id: "proj-1", name: "Checkout revamp", database: "production_v2", updatedLabel: "12 mins ago" },
  { id: "proj-2", name: "Churn analysis", database: "staging_logs", updatedLabel: "1 hour ago" },
  { id: "proj-3", name: "Q3 investor metrics", database: "production_v2", updatedLabel: "yesterday" },
];

export interface QueryTemplate {
  id: string;
  title: string;
  description: string;
  sql: string;
  category: string;
  isFavorite?: boolean;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: "tpl-1",
    title: "Top customers by spend",
    description: "Ranks customers by lifetime order value.",
    category: "Revenue",
    isFavorite: true,
    sql: `SELECT u.full_name, SUM(o.total_amount) AS lifetime_value
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.full_name
ORDER BY lifetime_value DESC
LIMIT 20;`,
  },
  {
    id: "tpl-2",
    title: "Monthly revenue trend",
    description: "Aggregates order totals by calendar month.",
    category: "Revenue",
    isFavorite: true,
    sql: `SELECT DATE_TRUNC('month', created_at) AS month, SUM(total_amount) AS revenue
FROM orders
GROUP BY month
ORDER BY month DESC;`,
  },
  {
    id: "tpl-3",
    title: "Inactive users (90+ days)",
    description: "Finds users with no orders in the last 90 days.",
    category: "Growth",
    sql: `SELECT u.id, u.email
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.created_at > NOW() - INTERVAL '90 days'
WHERE o.id IS NULL;`,
  },
  {
    id: "tpl-4",
    title: "Slowest queries this week",
    description: "Surfaces the highest-latency queries for tuning.",
    category: "Performance",
    sql: `SELECT sql_snippet, execution_ms
FROM query_history
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY execution_ms DESC
LIMIT 10;`,
  },
];

export const LEARNING_RESOURCES = [
  { id: "learn-1", title: "Writing your first AI prompt", duration: "3 min read" },
  { id: "learn-2", title: "JOINs, explained visually", duration: "6 min read" },
  { id: "learn-3", title: "Reading an execution plan", duration: "5 min read" },
];

export const PERFORMANCE_TRENDS = [30, 45, 60, 25, 80, 40, 55, 90, 35, 10];

// ---------------------------------------------------------------------------
// AI SQL Generator
// ---------------------------------------------------------------------------

export const GENERATOR_SUGGESTIONS = [
  "Find top customers",
  "Monthly sales",
  "Employee salaries",
  "Orders this month",
  "Revenue report",
  "Sales by city",
];

export const SQL_DIALECTS = ["PostgreSQL", "MySQL", "SQLite", "BigQuery"] as const;
export type SqlDialect = (typeof SQL_DIALECTS)[number];

export interface GeneratedQuery {
  sql: string;
  explanation: string;
  optimization: string;
}

const GENERATOR_RESPONSES: Record<string, GeneratedQuery> = {
  "find top customers": {
    sql: `SELECT u.full_name, u.email, SUM(o.total_amount) AS lifetime_value
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.full_name, u.email
ORDER BY lifetime_value DESC
LIMIT 10;`,
    explanation:
      "Joins users to their orders, sums order totals per customer, then sorts descending to surface the highest-value accounts first.",
    optimization:
      "Add a composite index on orders(user_id, total_amount) — this query currently does a full scan of orders before aggregating.",
  },
  "monthly sales": {
    sql: `SELECT DATE_TRUNC('month', created_at) AS month, SUM(total_amount) AS revenue
FROM orders
GROUP BY month
ORDER BY month DESC;`,
    explanation:
      "Truncates each order's timestamp down to the month, then aggregates total revenue per month for a trend view.",
    optimization: "A BRIN index on orders(created_at) would speed up the month-bucketing on large, time-ordered tables.",
  },
  "employee salaries": {
    sql: `SELECT department, ROUND(AVG(salary), 2) AS avg_salary, COUNT(*) AS headcount
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,
    explanation:
      "Groups employees by department and computes the average salary and headcount for each, ordered from highest to lowest pay.",
    optimization: "Consider a partial index on employees(department) WHERE active = true if most queries filter to current staff.",
  },
  "orders this month": {
    sql: `SELECT id, user_id, total_amount, status, created_at
FROM orders
WHERE created_at >= DATE_TRUNC('month', NOW())
ORDER BY created_at DESC;`,
    explanation: "Filters orders to those created since the start of the current calendar month, most recent first.",
    optimization: "This benefits from an index on orders(created_at) to avoid scanning historical rows.",
  },
  "revenue report": {
    sql: `SELECT
  DATE_TRUNC('week', o.created_at) AS week,
  p.category,
  SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
GROUP BY week, p.category
ORDER BY week DESC, revenue DESC;`,
    explanation:
      "Breaks revenue down by week and product category, joining line items through orders and products to compute weighted totals.",
    optimization: "For large catalogs, materializing this as a weekly rollup table would avoid recomputing joins on every run.",
  },
  "sales by city": {
    sql: `SELECT c.city, COUNT(o.id) AS order_count, SUM(o.total_amount) AS revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.city
ORDER BY revenue DESC;`,
    explanation: "Joins orders to customer location data, then aggregates order count and revenue per city.",
    optimization: "Add an index on customers(city) if this report runs frequently against a large customer table.",
  },
};

const DEFAULT_GENERATOR_RESPONSE: GeneratedQuery = {
  sql: `SELECT *
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 50;`,
  explanation:
    "A general-purpose starting query — it selects recent rows from the most relevant table found in your schema.",
  optimization: "Narrow the SELECT * to only the columns you need, and add a LIMIT appropriate to your use case.",
};

export function generateSqlForPrompt(prompt: string): GeneratedQuery {
  const key = prompt.trim().toLowerCase();
  return GENERATOR_RESPONSES[key] ?? DEFAULT_GENERATOR_RESPONSE;
}

