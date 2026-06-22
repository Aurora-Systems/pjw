import { describe, it, expect } from "vitest";
import { confirmedUsdAmount, mapStatus } from "@/lib/pesepay";

// The helpers only read a few fields; cast partial fixtures to the param type.
type TxArg = Parameters<typeof confirmedUsdAmount>[0];
const tx = (o: Record<string, unknown>) => o as unknown as TxArg;

describe("confirmedUsdAmount", () => {
  it("returns the amount for a valid USD transaction", () => {
    expect(confirmedUsdAmount(tx({ amountDetails: { amount: 10, currencyCode: "USD" } }))).toBe(10);
  });
  it("rejects non-USD currencies", () => {
    expect(confirmedUsdAmount(tx({ amountDetails: { amount: 10, currencyCode: "ZWL" } }))).toBeNull();
  });
  it("rejects missing or non-positive amounts", () => {
    expect(confirmedUsdAmount(tx({}))).toBeNull();
    expect(confirmedUsdAmount(tx({ amountDetails: { amount: 0, currencyCode: "USD" } }))).toBeNull();
  });
});

describe("mapStatus", () => {
  it("maps paid/success", () => {
    expect(mapStatus(tx({ paid: true }))).toBe("paid");
    expect(mapStatus(tx({ transactionStatus: "SUCCESS" }))).toBe("paid");
  });
  it("maps pending and terminal states", () => {
    expect(mapStatus(tx({ transactionStatus: "PENDING" }))).toBe("pending");
    expect(mapStatus(tx({ transactionStatus: "CANCELLED" }))).toBe("cancelled");
    expect(mapStatus(tx({ transactionStatus: "ERROR" }))).toBe("failed");
  });
});
