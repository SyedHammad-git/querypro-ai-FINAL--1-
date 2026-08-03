"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ChatConversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatHistorySidebarProps {
  className?: string;
  onSelectConversation: (conversation: ChatConversation) => void;
  selectedConversationId?: string;
}

function toConversationLabel(messages: ChatMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser?.text) return "Untitled chat";
  return firstUser.text.length > 42 ? `${firstUser.text.slice(0, 42)}…` : firstUser.text;
}

export function ChatHistorySidebar({ className, onSelectConversation, selectedConversationId }: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      setLoading(true);
      try {
        const res = await fetch("/api/chat/save");
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const payload = await res.json().catch(() => null);
        const loadedMessages = Array.isArray(payload?.messages) ? payload.messages : [];

        const mapped = loadedMessages.map((message: { id: string; role: string; content: string; sql?: string | null; createdAt?: string }) => ({
          id: message.id,
          role: message.role === "assistant" ? "assistant" : "user",
          text: message.content,
          sql: message.sql ?? undefined,
          timestamp: message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
        }));

        const grouped: ChatConversation[] = [];
        let current: ChatMessage[] = [];
        for (const message of mapped) {
          if (message.role === "user") {
            if (current.length > 0) {
              grouped.push({
                id: `chat-${grouped.length + 1}`,
                title: toConversationLabel(current),
                preview: current[current.length - 1]?.text ?? "",
                updatedAt: current[current.length - 1]?.timestamp ?? "",
                messages: current,
              });
            }
            current = [message];
          } else if (current.length > 0) {
            current = [...current, message];
          }
        }

        if (current.length > 0) {
          grouped.push({
            id: `chat-${grouped.length + 1}`,
            title: toConversationLabel(current),
            preview: current[current.length - 1]?.text ?? "",
            updatedAt: current[current.length - 1]?.timestamp ?? "",
            messages: current,
          });
        }

        if (active) {
          setConversations(grouped.reverse());
        }
      } catch (error) {
        console.error("[/components/chat/ChatHistorySidebar] failed to load conversations", error);
        if (active) setConversations([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadConversations();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className={cn("shrink-0 border-r border-border-subtle/80 bg-surface-container-lowest flex flex-col transition-all duration-200 min-h-0", collapsed ? "w-14" : "w-72", className)}>
      <div className={cn("flex items-center border-b border-border-subtle/70 px-2.5 py-2", collapsed ? "justify-center" : "justify-between")}>
        <div className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center")}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-ai/10 shrink-0">
            <MessageSquareText className="h-3.5 w-3.5 text-accent-ai" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface">History</h2>
              <p className="mt-0.5 text-[10px] leading-4 text-on-surface-variant">Saved chats</p>
            </div>
          )}
        </div>
        <IconButton
          aria-label={collapsed ? "Expand chat history" : "Collapse chat history"}
          className="h-7 w-7 shrink-0"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden="true" /> : <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" />}
        </IconButton>
      </div>

      {!collapsed ? (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
          {loading ? (
            <div className="rounded-md border border-dashed border-border-subtle/80 px-2.5 py-2.5 text-[11px] leading-5 text-on-surface-variant">
              Loading saved chats…
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-subtle/80 px-2.5 py-2.5 text-[11px] leading-5 text-on-surface-variant">
              No saved conversations yet.
            </div>
          ) : (
            conversations.map((conversation) => {
              const selected = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  className={cn(
                    "w-full rounded-md border px-2.5 py-2 text-left transition-all duration-200",
                    selected
                      ? "border-primary/25 bg-primary/10 text-on-surface shadow-[0_0_0_1px_rgba(78,222,163,0.08)]"
                      : "border-transparent bg-transparent hover:border-border-subtle/70 hover:bg-surface-container-low"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-medium leading-5">{conversation.title}</span>
                    {conversation.updatedAt ? <span className="shrink-0 text-[10px] text-on-surface-variant">{conversation.updatedAt}</span> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-on-surface-variant">{conversation.preview}</p>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 px-1.5 py-2">
          <div className="rounded-md border border-dashed border-border-subtle/80 px-1.5 py-2 text-center text-[10px] leading-4 text-on-surface-variant">
            History
          </div>
        </div>
      )}
    </aside>
  );
}
