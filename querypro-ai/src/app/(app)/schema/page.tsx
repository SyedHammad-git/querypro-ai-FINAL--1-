"use client";

import { useState } from "react";
import { SchemaTree, getDefaultTable } from "@/components/schema/SchemaTree";
import { ColumnsTable } from "@/components/schema/ColumnsTable";
import { SchemaPreviewPanel } from "@/components/schema/PreviewPanel";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { WorkspaceSkeleton } from "@/components/ui/Skeleton";
import type { SchemaTable } from "@/lib/types";

export default function SchemaExplorerPage() {
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(getDefaultTable());

  return (
    <LoadingReveal skeleton={<WorkspaceSkeleton />} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          <SchemaTree selectedTableId={selectedTable.id} onSelectTable={setSelectedTable} />
          <ColumnsTable table={selectedTable} />
          <SchemaPreviewPanel table={selectedTable} />
        </div>
      </LoadingReveal>
  );
}
