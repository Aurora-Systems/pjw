import { describe, it, expect, afterEach } from "vitest";
import { encrypt, decrypt, mapStatus, isPesepayConfigured, type PesepayTransaction } from "../pesepay";

const KEY = "0123456789abcdef0123456789abcdef"; // 32 chars -> AES-256

describe("pesepay encrypt/decrypt", () => {
  it("round-trips an object through AES-256-CBC", () => {
    const payload = { amountDetails: { amount: 42.5, currencyCode: "USD" }, reasonForPayment: "Booking" };
    const cipher = encrypt(payload, KEY);
    expect(typeof cipher).toBe("string");
    expect(cipher).not.toContain("amount"); // actually encrypted, not plaintext
    const back = decrypt(cipher, KEY);
    expect(back).toEqual(payload);
  });

  it("produces base64 output", () => {
    const cipher = encrypt({ a: 1 }, KEY);
    expect(/^[A-Za-z0-9+/]+=*$/.test(cipher)).toBe(true);
  });
});

describe("pesepay mapStatus", () => {
  const tx = (over: Partial<PesepayTransaction>): PesepayTransaction => ({
    referenceNumber: "r",
    pollUrl: "p",
    redirectUrl: "u",
    ...over,
  });

  it("maps paid/success to paid", () => {
    expect(mapStatus(tx({ paid: true }))).toBe("paid");
    expect(mapStatus(tx({ transactionStatus: "SUCCESS" }))).toBe("paid");
  });
  it("maps pending-ish statuses to pending", () => {
    expect(mapStatus(tx({ transactionStatus: "PENDING" }))).toBe("pending");
    expect(mapStatus(tx({ transactionStatus: "PROCESSING" }))).toBe("pending");
    expect(mapStatus(tx({ transactionStatus: "INITIATED" }))).toBe("pending");
  });
  it("maps cancelled/closed to cancelled", () => {
    expect(mapStatus(tx({ transactionStatus: "CANCELLED" }))).toBe("cancelled");
    expect(mapStatus(tx({ transactionStatus: "CLOSED" }))).toBe("cancelled");
    expect(mapStatus(tx({ transactionStatus: "TERMINATED" }))).toBe("cancelled");
  });
  it("defaults unknown statuses to failed", () => {
    expect(mapStatus(tx({ transactionStatus: "ERROR" }))).toBe("failed");
    expect(mapStatus(tx({}))).toBe("failed");
  });
});

describe("isPesepayConfigured", () => {
  afterEach(() => {
    delete process.env.PESEPAY_INTEGRATION_KEY;
    delete process.env.PESEPAY_ENCRYPTION_KEY;
  });
  it("is false without keys", () => {
    expect(isPesepayConfigured()).toBe(false);
  });
  it("is true with both keys", () => {
    process.env.PESEPAY_INTEGRATION_KEY = "ik";
    process.env.PESEPAY_ENCRYPTION_KEY = KEY;
    expect(isPesepayConfigured()).toBe(true);
  });
});
