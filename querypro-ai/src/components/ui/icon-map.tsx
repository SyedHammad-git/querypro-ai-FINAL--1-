import {
  LayoutDashboard,
  SquareTerminal,
  Bot,
  Workflow,
  History,
  Settings,
  FileText,
  LifeBuoy,
  Blocks,
  Bookmark,
  LayoutTemplate,
  LayoutGrid,
  UserCircle,
  HelpCircle,
  Code2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "square-terminal": SquareTerminal,
  bot: Bot,
  workflow: Workflow,
  history: History,
  settings: Settings,
  "file-text": FileText,
  "life-buoy": LifeBuoy,
  blocks: Blocks,
  bookmark: Bookmark,
  "layout-template": LayoutTemplate,
  "layout-grid": LayoutGrid,
  "user-circle": UserCircle,
  "help-circle": HelpCircle,
  "code-2": Code2,
  "upload-cloud": UploadCloud,
};

export function NavIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
