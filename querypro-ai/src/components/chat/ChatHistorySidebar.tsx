"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
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
    <aside className={cn("w-72 shrink-0 border-r border-border-subtle bg-surface-container-lowest flex flex-col", className)}>
      <div className="border-b border-border-subtle px-md py-sm">
        <div className="flex items-center gap-sm">
          <MessageSquareText className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-label-md text-on-surface">Recent chats</h2>
        </div>
        <p className="mt-1 text-label-sm text-on-surface-variant">Open a saved conversation and continue it.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-sm space-y-2">
        {loading ? (
          <div className="rounded border border-dashed border-border-subtle px-sm py-md text-label-sm text-on-surface-variant">
            Loading saved chats…
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded border border-dashed border-border-subtle px-sm py-md text-label-sm text-on-surface-variant">
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
                  "w-full rounded-lg border px-sm py-sm text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-transparent bg-surface-container-low hover:border-outline-variant hover:bg-surface-container-high"
                )}
              >
                <div className="flex items-center justify-between gap-sm">
                  <span className="font-label-md truncate">{conversation.title}</span>
                  {conversation.updatedAt ? <span className="text-[10px] text-on-surface-variant">{conversation.updatedAt}</span> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{conversation.preview}</p>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
