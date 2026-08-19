"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { AdminUser, AdminWalletAction, AdminWalletTxn } from "../../lib/types";
import { Avatar, Badge, Empty, Loading, inputClass } from "../ui";
import Button from "../Button";
import {
  ErrorNote,
  Modal,
  SearchInput,
  TableShell,
  Td,
  Th,
  errText,
  fmtDateTime,
  money,
  signedMoney,
  useDebounced,
} from "./shared";

/** Who the console is looking at. Only providers have a wallet at all. */
export interface WalletTarget {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

const TX_COLOR: Record<string, "blue" | "green" | "amber" | "slate" | "red"> = {
  topup: "green",
  admin_credit: "green",
  commission_refund: "blue",
  commission: "amber",
  topup_reversal: "red",
};

const ACTIONS: { action: AdminWalletAction; label: string; blurb: string }[] = [
  { action: "credit", label: "Add credit", blurb: "Put money on this wallet (goodwill, correction)" },
  { action: "reverse_topup", label: "Reverse a top-up", blurb: "Claw back a top-up that never really cleared" },
  { action: "refund_commission", label: "Refund a commission", blurb: "Give back the 10% taken for one booking" },
];

export default function WalletTab({ initialTarget }: { initialTarget?: WalletTarget | null }) {
  const [target, setTarget] = useState<WalletTarget | null>(initialTarget ?? null);
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<AdminWalletTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dialog, setDialog] = useState<AdminWalletAction | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    try {
      const res = await api.adminWallet(target.id);
      setBalance(res.balance);
      setTxns(res.transactions);
      setErr(null);
    } catch (e) {
      setErr(errText(e, "Could not load that wallet."));
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!target) {
    return <ProviderPicker onPick={setTarget} />;
  }

  return (
    <>
      <div className="rounded-2xl border border-pj-slate-200 bg-white p-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar src={target.avatar_url} name={target.full_name} size={48} />
            <div>
              <div className="font-bold text-pj-slate-900">{target.full_name}</div>
              <div className="text-sm text-pj-slate-500">{target.email || "no email on file"}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-extrabold ${balance !== null && balance < 0 ? "text-red-600" : "text-pj-slate-900"}`}>
              {balance === null ? "—" : money(balance)}
            </div>
            <div className="text-xs text-pj-slate-500">wallet balance</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTarget(null);
              setBalance(null);
              setTxns([]);
              setNote(null);
              setErr(null);
            }}
          >
            Choose someone else
          </Button>
        </div>

        {balance !== null && balance < 0 && (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            This wallet is in the red. {target.full_name} cannot make offers until they top up past zero.
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {ACTIONS.map((a) => (
            <button
              key={a.action}
              type="button"
              // The balance is what every confirmation is stated against, so no action is
              // offered until it has actually loaded.
              disabled={balance === null}
              onClick={() => setDialog(a.action)}
              className="text-left rounded-xl border border-pj-slate-200 hover:border-pj-blue-300 bg-pj-slate-50 p-3 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-semibold text-pj-slate-900 text-sm">{a.label}</div>
              <div className="text-xs text-pj-slate-500 mt-0.5">{a.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      {note && (
        <div className="mb-4 rounded-2xl border border-pj-blue-200 bg-pj-blue-50 px-4 py-3 text-sm text-pj-blue-700">
          {note}
        </div>
      )}

      {err && (
        <div className="mb-4">
          <ErrorNote onRetry={() => void load()}>{err}</ErrorNote>
        </div>
      )}

      {loading && txns.length === 0 ? (
        <Loading />
      ) : txns.length === 0 ? (
        <Empty>No wallet movements yet.</Empty>
      ) : (
        <TableShell minWidth={720}>
          <thead className="bg-pj-slate-50 border-b border-pj-slate-200">
            <tr>
              <Th>When</Th>
              <Th>Type</Th>
              <Th>Description</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Balance after</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pj-slate-200">
            {txns.map((t) => (
              <tr key={t.id}>
                <Td className="whitespace-nowrap text-pj-slate-500">{fmtDateTime(t.created_at)}</Td>
                <Td>
                  <Badge color={TX_COLOR[t.type] ?? "slate"}>{t.type.replace(/_/g, " ")}</Badge>
                </Td>
                <Td className="text-pj-slate-700">{t.description || "—"}</Td>
                <Td className={`text-right font-semibold whitespace-nowrap ${t.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {signedMoney(t.amount)}
                </Td>
                <Td className="text-right whitespace-nowrap text-pj-slate-500">{money(t.balance_after)}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {dialog && balance !== null && (
        <WalletActionDialog
          action={dialog}
          target={target}
          balance={balance}
          onClose={() => setDialog(null)}
          onDone={(newBalance, message) => {
            setBalance(newBalance);
            setNote(message);
            setDialog(null);
            void load();
          }}
        />
      )}
    </>
  );
}

/** Search for the provider whose wallet you want. Only providers hold one. */
function ProviderPicker({ onPick }: { onPick: (t: WalletTarget) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const debounced = useDebounced(q);
  const seq = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);
    api
      .adminUsers({ role: "provider", q: debounced || undefined, limit: 10 })
      .then((res) => {
        if (mine !== seq.current) return;
        setResults(res.users);
        setErr(null);
      })
      .catch((e) => {
        if (mine !== seq.current) return;
        setErr(errText(e, "Could not search providers."));
      })
      .finally(() => {
        if (mine === seq.current) setLoading(false);
      });
  }, [debounced]);

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-pj-slate-500 mb-3">
        Pick the provider whose wallet you need. Only providers have one — customers and companies never do.
      </p>
      <div className="flex mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search providers by name, email or phone…" />
      </div>

      {err && <ErrorNote>{err}</ErrorNote>}

      {loading && results.length === 0 ? (
        <Loading />
      ) : results.length === 0 ? (
        <Empty>No provider matches that.</Empty>
      ) : (
        <div className="space-y-2">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onPick({ id: u.id, full_name: u.full_name, email: u.email, avatar_url: u.avatar_url })}
              className="w-full text-left rounded-2xl border border-pj-slate-200 bg-white hover:border-pj-blue-300 p-4 flex items-center justify-between gap-3 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={u.avatar_url} name={u.full_name} size={38} />
                <div className="min-w-0">
                  <div className="font-semibold text-pj-slate-900 truncate">{u.full_name}</div>
                  <div className="text-xs text-pj-slate-500 truncate">{u.email || u.phone || "no contact"}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-bold ${(u.balance ?? 0) < 0 ? "text-red-600" : "text-pj-slate-900"}`}>
                  {money(u.balance)}
                </div>
                {u.banned && <Badge color="red">banned</Badge>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Two steps on purpose: fill the form, then read back exactly what will happen and to whom
 * before anything moves. Nothing here fires on a single click, and the API refuses any of it
 * without a reason.
 */
function WalletActionDialog({
  action,
  target,
  balance,
  onClose,
  onDone,
}: {
  action: AdminWalletAction;
  target: WalletTarget;
  balance: number;
  onClose: () => void;
  onDone: (balance: number, message: string) => void;
}) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [amount, setAmount] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const needsAmount = action !== "refund_commission";
  const parsed = Math.round((Number(amount) || 0) * 100) / 100;
  const delta = action === "credit" ? parsed : -parsed;
  const projected = Math.round((balance + delta) * 100) / 100;

  const title =
    action === "credit"
      ? "Add credit"
      : action === "reverse_topup"
        ? "Reverse a top-up"
        : "Refund a commission";

  const review = () => {
    if (needsAmount) {
      if (!(parsed > 0)) return setErr("Enter an amount greater than zero.");
      if (parsed > 100000) return setErr("That is over the $100,000 limit the API allows.");
    } else if (!UUID_RE.test(bookingId.trim())) {
      return setErr("Paste the booking's id — it looks like 3fa85f64-5717-4562-b3fc-2c963f66afa6.");
    }
    if (!reason.trim()) return setErr("A reason is required. It is written into the ledger and the audit trail.");
    setErr(null);
    setStep("confirm");
  };

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.adminWalletAction(target.id, {
        action,
        amount: needsAmount ? parsed : undefined,
        booking_id: needsAmount ? undefined : bookingId.trim(),
        reason: reason.trim(),
      });
      const moved = Math.abs(res.transaction.amount);
      const message =
        action === "credit"
          ? `Added ${money(moved)} to ${target.full_name}'s wallet. Balance is now ${money(res.balance)}.`
          : action === "reverse_topup"
            ? `Reversed ${money(moved)} off ${target.full_name}'s wallet. Balance is now ${money(res.balance)}.${
                res.balance < 0 ? " That leaves them in the red — they cannot make offers until they top up." : ""
              }`
            : `Refunded ${money(moved)} of commission. Balance is now ${money(res.balance)}.`;
      onDone(res.balance, message);
    } catch (e) {
      setErr(errText(e));
      setBusy(false);
      setStep("form");
    }
  };

  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      {step === "form" ? (
        <>
          <p className="mt-2 text-sm text-pj-slate-500">
            {target.full_name} · balance {money(balance)}
          </p>

          <div className="space-y-4 mt-4">
            {needsAmount ? (
              <label className="block">
                <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Amount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </label>
            ) : (
              <label className="block">
                <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Booking id</span>
                <input
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className={inputClass}
                  placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
                />
                <span className="block text-xs text-pj-slate-400 mt-1">
                  The booking whose 10% commission is being given back. It must belong to this provider, must have
                  been charged, and can only be refunded once.
                </span>
              </label>
            )}

            <label className="block">
              <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Reason (required)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                className={inputClass}
                placeholder="Why is this money moving?"
              />
              <span className="block text-xs text-pj-slate-400 mt-1">
                This is written into the ledger line and the audit trail. An unexplained money movement is
                indistinguishable from fraud when someone reads it back in six months.
              </span>
            </label>
          </div>

          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}

          <div className="flex gap-2 mt-5">
            <Button className="flex-1" onClick={review}>
              Review
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 rounded-xl border border-pj-slate-200 bg-pj-slate-50 p-4 text-sm space-y-2">
            {action === "refund_commission" ? (
              <p className="text-pj-slate-900">
                Refund the commission charged for booking{" "}
                <span className="font-mono text-xs">{bookingId.trim()}</span> back to{" "}
                <strong>{target.full_name}</strong>. The amount comes from the original charge, so it is added back
                exactly as it was taken.
              </p>
            ) : (
              <>
                <p className="text-pj-slate-900">
                  {action === "credit" ? "Add" : "Take"} <strong>{money(parsed)}</strong>{" "}
                  {action === "credit" ? "to" : "off"} <strong>{target.full_name}</strong>&apos;s wallet.
                </p>
                <p className="text-pj-slate-500">
                  Balance {money(balance)} → <strong className={projected < 0 ? "text-red-600" : "text-pj-slate-900"}>{money(projected)}</strong>
                </p>
              </>
            )}
            <p className="text-pj-slate-500">
              Reason: <span className="text-pj-slate-700">{reason.trim()}</span>
            </p>
          </div>

          {action === "reverse_topup" && projected < 0 && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              This takes the wallet {money(projected)} — below zero. {target.full_name} will not be able to make any
              offer until they top up past zero. That is allowed (the money really did leave), but do it knowingly.
            </p>
          )}

          <p className="mt-3 text-xs text-pj-slate-400">
            The provider is notified, and this is recorded against your name in the audit trail.
          </p>

          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}

          <div className="flex gap-2 mt-5">
            <Button className="flex-1" disabled={busy} onClick={run}>
              {busy ? "Working…" : action === "credit" ? `Add ${money(parsed)}` : action === "reverse_topup" ? `Reverse ${money(parsed)}` : "Refund the commission"}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setStep("form")}>
              Back
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
