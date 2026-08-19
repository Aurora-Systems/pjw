"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { AdminUser, AdminUserStatus } from "../../lib/types";
import { Avatar, Badge, Empty, Loading, VerifiedBadge } from "../ui";
import Button from "../Button";
import {
  ConfirmDialog,
  ErrorNote,
  FilterPills,
  Pager,
  RoleBadge,
  SearchInput,
  TableShell,
  Td,
  Th,
  errText,
  fmtDate,
  money,
  useDebounced,
} from "./shared";

const LIMIT = 25;

const STATUS_OPTIONS: { value: AdminUserStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "unverified", label: "Not cleared" },
  { value: "banned", label: "Banned" },
];

const ROLE_OPTIONS = ["", "customer", "provider", "corporate", "admin"];

type Dialog =
  | { kind: "gate"; user: AdminUser; next: boolean }
  | { kind: "ban"; user: AdminUser; next: boolean };

export default function UsersTab({ onOpenWallet }: { onOpenWallet: (user: AdminUser) => void }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<AdminUserStatus>("all");
  const [offset, setOffset] = useState(0);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const debouncedQ = useDebounced(q);
  // Only the newest request may write to state — filters change faster than the network.
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await api.adminUsers({ q: debouncedQ || undefined, role: role || undefined, status, limit: LIMIT, offset });
      if (mine !== seq.current) return;
      setUsers(res.users);
      setTotal(res.total);
      setErr(null);
    } catch (e) {
      if (mine !== seq.current) return;
      setErr(errText(e, "Could not load users."));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [debouncedQ, role, status, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  // Any filter change starts a new result set, so page 1 is the only sensible position.
  // Done where the filter changes rather than in an effect watching it: an effect would
  // fetch page N of the new filter first and then snap back to page 1.
  const changeQ = (next: string) => {
    setQ(next);
    setOffset(0);
  };
  const changeRole = (next: string) => {
    setRole(next);
    setOffset(0);
  };
  const changeStatus = (next: AdminUserStatus) => {
    setStatus(next);
    setOffset(0);
  };

  const patchRow = (id: string, patch: Partial<AdminUser>) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const setGate = async (user: AdminUser, next: boolean, reason: string) => {
    const res = await api.adminUpdateUser(user.id, { id_verified: next, reason: reason || undefined });
    patchRow(user.id, { id_verified: res.user.id_verified });
  };

  const setBanned = async (user: AdminUser, next: boolean, reason: string) => {
    await api.adminBanUser(user.id, next, reason || undefined);
    patchRow(user.id, { banned: next });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={q} onChange={changeQ} placeholder="Search name, email or phone…" />
        <select
          value={role}
          onChange={(e) => changeRole(e.target.value)}
          className="rounded-xl border border-pj-slate-200 bg-white text-pj-slate-900 px-3 py-2.5 text-sm font-semibold cursor-pointer"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r || "any"} value={r}>
              {r ? r[0].toUpperCase() + r.slice(1) : "Every role"}
            </option>
          ))}
        </select>
        <FilterPills options={STATUS_OPTIONS} value={status} onChange={changeStatus} />
      </div>

      {err && (
        <div className="mb-4">
          <ErrorNote onRetry={() => void load()}>{err}</ErrorNote>
        </div>
      )}

      {loading && users.length === 0 ? (
        <Loading />
      ) : users.length === 0 ? (
        <Empty>No one matches that.</Empty>
      ) : (
        <>
          <TableShell minWidth={980}>
            <thead className="bg-pj-slate-50 border-b border-pj-slate-200">
              <tr>
                <Th>Person</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th>Activity</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pj-slate-200">
              {users.map((u) => (
                <tr key={u.id} className={u.banned ? "opacity-70" : ""}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.full_name} size={36} />
                      <div className="min-w-0">
                        <div className="font-semibold text-pj-slate-900 flex items-center gap-1.5">
                          <span className="truncate max-w-[200px]">{u.full_name}</span>
                          {/* The badge is Didit KYC only — never the admin-granted work gate. */}
                          {u.didit_status?.toLowerCase() === "approved" && <VerifiedBadge size={14} />}
                        </div>
                        <div className="text-xs text-pj-slate-500 truncate max-w-[220px]">
                          {u.email || u.phone || "no contact on file"}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <RoleBadge role={u.role} />
                  </Td>
                  <Td className="whitespace-nowrap text-pj-slate-500">{fmtDate(u.created_at)}</Td>
                  <Td className="whitespace-nowrap text-xs text-pj-slate-500">
                    {u.jobs_count} jobs · {u.bookings_count} bookings
                    {u.balance !== null && <div className="text-pj-slate-400">wallet {money(u.balance)}</div>}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {u.banned && <Badge color="red">banned</Badge>}
                      {u.id_verified ? <Badge color="green">cleared to work</Badge> : <Badge color="slate">not cleared</Badge>}
                    </div>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      {!u.banned && (
                        <Button
                          size="sm"
                          variant={u.id_verified ? "ghost" : "outline"}
                          onClick={() => setDialog({ kind: "gate", user: u, next: !u.id_verified })}
                        >
                          {u.id_verified ? "Revoke" : "Approve"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={u.banned ? "outline" : "ghost"}
                        onClick={() => setDialog({ kind: "ban", user: u, next: !u.banned })}
                      >
                        {u.banned ? "Reinstate" : "Ban"}
                      </Button>
                      {u.balance !== null && (
                        <Button size="sm" variant="secondary" onClick={() => onOpenWallet(u)}>
                          Wallet
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pager offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
        </>
      )}

      {dialog?.kind === "gate" && (
        <ConfirmDialog
          title={dialog.next ? `Clear ${dialog.user.full_name} to work?` : `Revoke ${dialog.user.full_name}'s clearance?`}
          confirmLabel={dialog.next ? "Approve" : "Revoke clearance"}
          danger={!dialog.next}
          reasonRequired={!dialog.next}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => setGate(dialog.user, dialog.next, reason)}
        >
          {dialog.next ? (
            <>
              <p>They will be able to make offers on jobs straight away.</p>
              <p>
                This is the <strong className="text-pj-slate-700">permission to work</strong> gate — it does{" "}
                <strong className="text-pj-slate-700">not</strong> give them the public Verified badge, which only a
                completed Didit ID check earns.
              </p>
            </>
          ) : (
            <>
              <p>They will not be able to bid on anything until clearance is granted again.</p>
              <p>They go back into the verification queue, and their existing bookings are untouched.</p>
            </>
          )}
        </ConfirmDialog>
      )}

      {dialog?.kind === "ban" && (
        <ConfirmDialog
          title={dialog.next ? `Ban ${dialog.user.full_name}?` : `Reinstate ${dialog.user.full_name}?`}
          confirmLabel={dialog.next ? "Ban this account" : "Reinstate"}
          danger={dialog.next}
          reasonRequired={dialog.next}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => setBanned(dialog.user, dialog.next, reason)}
        >
          {dialog.next ? (
            <>
              <p>
                Every session they have is signed out immediately, and they disappear from public listings and search.
              </p>
              <p>Nothing is deleted — reinstating them puts everything back.</p>
            </>
          ) : (
            <p>They can sign in again and reappear in public listings. They will need to sign in fresh.</p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
