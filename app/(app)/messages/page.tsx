"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { Card, Avatar, PageHeader, Loading, Empty } from "../../components/ui";
import type { Conversation } from "../../lib/types";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.conversations().then(({ conversations }) => {
      setConversations(conversations);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Messages" subtitle="Your conversations" />
      {conversations.length === 0 ? (
        <Empty>No conversations yet.</Empty>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`}>
              <Card className="hover:border-pj-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar src={c.counterparty_avatar_url} name={c.counterparty_name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-3">
                      <div className="font-semibold text-pj-slate-900">{c.counterparty_name}</div>
                      {c.last_at && (
                        <div className="text-xs text-pj-slate-400 shrink-0">
                          {new Date(c.last_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-pj-slate-500 truncate mt-0.5">
                      {c.last_message || "No messages yet"}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
