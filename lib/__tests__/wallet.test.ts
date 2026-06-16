import { describe, it, expect, beforeAll } from "vitest";

// wallet.ts imports lib/db, which throws unless DATABASE_URL is set. Set a dummy
// (neon() is lazy and commissionFor never queries) and import dynamically after.
let commissionFor: (n: number | null | undefined) => number;
let COMMISSION_RATE: number;
let TOPUP_PACKAGES: number[];

beforeAll(async () => {
  process.env.DATABASE_URL ||= "postgresql://user:pass@localhost/db";
  const mod = await import("../wallet");
  commissionFor = mod.commissionFor;
  COMMISSION_RATE = mod.COMMISSION_RATE;
  TOPUP_PACKAGES = mod.TOPUP_PACKAGES;
});

describe("commissionFor (10% of job value, rounded to cents)", () => {
  it("computes 10% of the job value", () => {
    expect(commissionFor(100)).toBe(10);
    expect(commissionFor(250)).toBe(25);
    expect(commissionFor(45)).toBe(4.5);
  });
  it("treats missing/zero as no commission", () => {
    expect(commissionFor(0)).toBe(0);
    expect(commissionFor(null)).toBe(0);
    expect(commissionFor(undefined)).toBe(0);
  });
  it("rounds to two decimals", () => {
    expect(commissionFor(33.33)).toBe(3.33); // 3.333 -> 3.33
    expect(commissionFor(99.99)).toBe(10); //   9.999 -> 10.00
    expect(commissionFor(12.34)).toBe(1.23); // 1.234 -> 1.23
  });
});

describe("wallet config", () => {
  it("commission rate is 10%", () => {
    expect(COMMISSION_RATE).toBe(0.1);
  });
  it("top-up packages are positive amounts", () => {
    expect(TOPUP_PACKAGES.length).toBeGreaterThan(0);
    expect(TOPUP_PACKAGES.every((n) => n > 0)).toBe(true);
  });
});
