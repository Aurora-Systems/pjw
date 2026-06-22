"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { Loading, inputClass } from "../../../components/ui";
import Button from "../../../components/Button";
import type { Message } from "../../../lib/types";

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async (incremental = false) => {
    const since = incremental && messages.length ? messages[messages.length - 1].created_at : undefined;
    const { messages: fetched } = await api.messages(id, since);
    if (fetched.length) {
      setMessages((m) => {
        if (!incremental) return fetched;
        const seen = new Set(m.map((x) => x.id));
        return [...m, ...fetched.filter((x) => !seen.has(x.id))];
      });
    } else if (!incremental) {
      setMessages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Light polling so new messages from the other party appear — incremental.
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const { message } = await api.sendMessage(id, body);
      setMessages((cur) => [...cur, message]);
      setText("");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
      <button onClick={() => router.push("/messages")} className="text-sm text-pj-blue-700 mb-3 self-start">
        ← All conversations
      </button>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-center text-pj-slate-400 text-sm mt-8">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-pj-blue-600 text-white" : "bg-pj-slate-100 text-pj-slate-900"
                  }`}
                >
                  <div>{m.body}</div>
                  <div className={`text-[10px] mt-0.5 ${mine ? "text-pj-blue-100" : "text-pj-slate-400"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className={inputClass}
        />
        <Button type="submit" disabled={sending || !text.trim()}>
          {sending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
