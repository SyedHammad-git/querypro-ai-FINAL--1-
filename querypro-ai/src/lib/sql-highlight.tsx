import type { ReactNode } from "react";

/**
 * Lightweight SQL tokenizer + highlighter.
 *
 * Colors are the dedicated `syntax-*` tokens (exact hex from the QueryPro
 * AI mockups: keyword blue #4680FF, string emerald #10B981, comment slate
 * #64748B, function amber #FBBF24) since code blocks always sit on the
 * dark `code-bg` surface regardless of which page hosts them (chat,
 * workspace, dashboard, or history) — theme-invariant by design.
 */

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN",
  "FULL JOIN", "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
  "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE TABLE",
  "CREATE OR REPLACE FUNCTION", "CREATE TRIGGER", "ALTER TABLE", "DROP TABLE",
  "RETURNS TRIGGER AS", "BEFORE UPDATE ON", "FOR EACH ROW EXECUTE PROCEDURE",
  "BEGIN", "RETURN", "END", "AS", "AND", "OR", "NOT", "NULL", "IS", "IN",
  "LIKE", "BETWEEN", "DISTINCT", "ASC", "DESC", "PRIMARY KEY", "FOREIGN KEY",
  "REFERENCES", "DEFAULT", "UNIQUE", "NOT NULL", "INTERVAL", "CASE", "WHEN",
  "THEN", "ELSE", "WITH", "language", "UUID", "PRIMARY KEY DEFAULT",
  "timestamp with time zone DEFAULT", "varchar", "now",
];

// Longest-match-first so multi-word keywords aren't shadowed by single words.
const KEYWORD_PATTERN = KEYWORDS.slice()
  .sort((a, b) => b.length - a.length)
  .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const TOKEN_REGEX = new RegExp(
  [
    `--[^\n]*`, // line comments
    `'(?:[^'\\\\]|\\\\.)*'`, // string literals
    `\\b(?:${KEYWORD_PATTERN})\\b`, // keywords
    `\\b\\d+(?:\\.\\d+)?\\b`, // numbers
    `\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\()`, // function calls
  ].join("|"),
  "gi"
);

type TokenKind = "comment" | "string" | "keyword" | "number" | "function" | "text";

interface Token {
  kind: TokenKind;
  value: string;
}

function classify(match: string): TokenKind {
  if (match.startsWith("--")) return "comment";
  if (match.startsWith("'")) return "string";
  if (/^\d/.test(match)) return "number";
  const upper = match.toUpperCase();
  if (KEYWORDS.some((kw) => kw.toUpperCase() === upper)) return "keyword";
  return "function";
}

export function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  TOKEN_REGEX.lastIndex = 0;
  while ((m = TOKEN_REGEX.exec(sql)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: "text", value: sql.slice(lastIndex, m.index) });
    }
    tokens.push({ kind: classify(m[0]), value: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < sql.length) {
    tokens.push({ kind: "text", value: sql.slice(lastIndex) });
  }
  return tokens;
}

const TOKEN_CLASSES: Record<TokenKind, string> = {
  comment: "text-syntax-comment",
  string: "text-syntax-string",
  keyword: "text-syntax-keyword",
  number: "text-tertiary-fixed-dim",
  function: "text-syntax-function",
  text: "text-white/90",
};

/** Renders SQL as a list of highlighted <span> nodes, ready to drop in a <pre><code>. */
export function highlightSql(sql: string): ReactNode[] {
  return tokenizeSql(sql).map((token, index) => (
    <span key={index} className={TOKEN_CLASSES[token.kind]}>
      {token.value}
    </span>
  ));
}
