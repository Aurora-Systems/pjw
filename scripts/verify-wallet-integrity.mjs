// Wallet invariant: provider_profiles.balance MUST equal SUM(wallet_transactions.amount).
// Run on a schedule / before releases. Exits non-zero if any provider drifts.
// Run: node --env-file=.env.local scripts/verify-wallet-integrity.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const drift = await sql`
  SELECT pp.user_id,
         pp.balance::numeric AS balance,
         COALESCE(SUM(wt.amount), 0)::numeric AS ledger_sum
  FROM provider_profiles pp
  LEFT JOIN wallet_transactions wt ON wt.provider_id = pp.user_id
  GROUP BY pp.user_id, pp.balance
  HAVING ABS(pp.balance - COALESCE(SUM(wt.amount), 0)) > 0.005
`;

if (drift.length === 0) {
  console.log("OK: all provider balances match their ledgers");
  process.exit(0);
}
console.error(`DRIFT: ${drift.length} provider(s) where balance != SUM(transactions):`);
for (const d of drift) {
  console.error(`  ${d.user_id}: balance=${d.balance} ledger=${d.ledger_sum} diff=${Number(d.balance) - Number(d.ledger_sum)}`);
}
process.exit(1);
