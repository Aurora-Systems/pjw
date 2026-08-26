"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { Loading, inputClass } from "../../../components/ui";
import Button from "../../../components/Button";
import { uploadChatFile, CHAT_ACCEPT } from "../../../lib/upload";
import { looksLikeContactSharing, CONTACT_WARNING } from "../../../lib/contact-warning";
import type { Message } from "../../../lib/types";

/** An attachment renders as an inline thumbnail (images) or a download chip (documents). */
function Attachment({ message, mine }: { message: Message; mine: boolean }) {
  const url = message.attachment_url;
  if (!url) return null;
  const isImage = (message.attachment_type ?? "").startsWith("image/");
  const name = message.attachment_name || "Attachment";

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1 mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          className="rounded-xl max-h-56 w-auto max-w-full object-cover border border-black/5"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      className={`flex items-center gap-2 mt-1 mb-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
        mine
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-white text-pj-slate-700 border border-pj-slate-200 hover:border-pj-blue-500"
      }`}
    >
      <PaperclipIcon className="h-4 w-4 shrink-0" />
      <span className="truncate max-w-[180px]">{name}</span>
    </a>
  );
}

function PaperclipIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // Attachments send as their own message (with whatever text is in the box as the caption).
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url, type, name } = await uploadChatFile(file);
      const { message } = await api.sendMessage(id, text.trim(), {
        attachment_url: url,
        attachment_type: type,
        attachment_name: name,
      });
      setMessages((cur) => [...cur, message]);
      setText("");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const busy = sending || uploading;
  const showContactWarning = looksLikeContactSharing(text);

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
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-pj-blue-600 text-white" : "bg-pj-slate-100 text-pj-slate-900"
                  }`}
                >
                  <Attachment message={m} mine={mine} />
                  {m.body ? <div>{m.body}</div> : null}
                  <div className={`text-[10px] mt-0.5 ${mine ? "text-pj-blue-100" : "text-pj-slate-400"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {/* Without this the reader just sees "***" and assumes the sender typed nonsense. */}
                {m.masked && (
                  <div className="mt-0.5 max-w-[75%] text-[11px] text-pj-slate-400">
                    Contact details hidden — keep arrangements on PocketJobs.
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {uploading && (
        <p className="text-xs text-pj-slate-500 pt-3 pb-1">Uploading…</p>
      )}
      {uploadError && (
        <p className="text-xs text-red-600 pt-3 pb-1">{uploadError}</p>
      )}

      {/* Non-blocking nudge: the message still sends exactly as typed. */}
      {showContactWarning && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          {CONTACT_WARNING}
        </div>
      )}

      <form onSubmit={send} className="flex items-center gap-2 pt-3">
        <input
          ref={fileRef}
          type="file"
          accept={CHAT_ACCEPT}
          onChange={onPickFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title="Attach a photo or document"
          aria-label="Attach a photo or document"
          className="shrink-0 p-3 rounded-full text-pj-slate-500 hover:text-pj-blue-600 hover:bg-pj-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <PaperclipIcon />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className={inputClass}
        />
        <Button type="submit" disabled={busy || !text.trim()}>
          {sending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
