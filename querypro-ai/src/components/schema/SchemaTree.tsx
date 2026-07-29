"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Folder,
  FolderOpen,
  FunctionSquare,
  Search,
  TableProperties,
} from "lucide-react";
import { SCHEMA_GROUPS } from "@/lib/mock-data";
import type { SchemaTable } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<SchemaTable["kind"], typeof TableProperties> = {
  table: TableProperties,
  view: Eye,
  procedure: FunctionSquare,
};

const KIND_COLOR: Record<SchemaTable["kind"], string> = {
  table: "",
  view: "text-tertiary",
  procedure: "text-error",
};

interface SchemaTreeProps {
  selectedTableId: string;
  onSelectTable: (table: SchemaTable) => void;
}

export function SchemaTree({ selectedTableId, onSelectTable }: SchemaTreeProps) {
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(SCHEMA_GROUPS.map((g) => [g.id, g.expanded]))
  );

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return SCHEMA_GROUPS;
    const q = query.toLowerCase();
    return SCHEMA_GROUPS.map((group) => ({
      ...group,
      tables: group.tables.filter((t) => t.name.toLowerCase().includes(q)),
    }));
  }, [query]);

  return (
    <section
      className="w-72 shrink-0 bg-surface-container-lowest border-r border-border-subtle flex flex-col"
      aria-label="Schema navigator"
    >
      <div className="p-md border-b border-border-subtle">
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 h-[13.5px] w-[13.5px] text-outline"
            aria-hidden="true"
          />
          <label htmlFor="schema-search" className="sr-only">
            Search schema
          </label>
          <input
            id="schema-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-md py-1.5 text-sm border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            placeholder="Search schema…"
            type="text"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-sm">
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const expanded = expandedGroups[group.id] ?? false;
            const FolderIcon = expanded ? FolderOpen : Folder;
            const hasContent = group.tables.length > 0;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                  }
                  aria-expanded={expanded}
                  className={cn(
                    "w-full flex items-center gap-xs px-sm py-1 rounded hover:bg-surface-container-low transition-colors",
                    !hasContent && "opacity-70"
                  )}
                >
                  {expanded ? (
                    <ChevronDown className="h-[13.5px] w-[13.5px] text-outline shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-[13.5px] w-[13.5px] text-outline shrink-0" aria-hidden="true" />
                  )}
                  <FolderIcon className="h-[13.5px] w-[13.5px] text-secondary shrink-0" aria-hidden="true" />
                  <span className="font-label-md text-on-surface truncate">{group.name}</span>
                </button>

                {expanded && (
                  <div className="ml-6 space-y-1 mt-1">
                    {group.tables.length === 0 ? (
                      <p className="px-sm py-1 text-label-sm text-outline italic">
                        No objects indexed yet
                      </p>
                    ) : (
                      group.tables.map((table) => {
                        const Icon = KIND_ICON[table.kind];
                        const isSelected = table.id === selectedTableId;
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => onSelectTable(table)}
                            aria-current={isSelected ? "true" : undefined}
                            className={cn(
                              "w-full flex items-center gap-xs px-sm py-1 rounded transition-colors text-left",
                              isSelected
                                ? "bg-primary/5 text-primary border-l-2 border-primary"
                                : "hover:bg-surface-container-low text-on-surface-variant border-l-2 border-transparent"
                            )}
                          >
                            <Icon
                              className={cn("h-[13.5px] w-[13.5px] shrink-0", !isSelected && KIND_COLOR[table.kind])}
                              aria-hidden="true"
                            />
                            <span
                              className={cn(
                                "font-sans text-body-md truncate",
                                isSelected && "font-medium"
                              )}
                            >
                              {table.name}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function getDefaultTable(): SchemaTable {
  const publicGroup = SCHEMA_GROUPS.find((g) => g.id === "public");
  return publicGroup?.tables[0] as SchemaTable;
}

export function findTableById(id: string): SchemaTable | undefined {
  for (const group of SCHEMA_GROUPS) {
    const match = group.tables.find((t) => t.id === id);
    if (match) return match;
  }
  return undefined;
}

/** Case-insensitive lookup by table name — used to resolve FROM/JOIN clauses parsed from raw SQL text. */
export function findTableByName(name: string): SchemaTable | undefined {
  const target = name.toLowerCase();
  for (const group of SCHEMA_GROUPS) {
    const match = group.tables.find((t) => t.name.toLowerCase() === target);
    if (match) return match;
  }
  return undefined;
}
