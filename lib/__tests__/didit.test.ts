import { describe, it, expect, afterEach } from "vitest";
import crypto from "crypto";
import { mapDiditStatus, verifyWebhookSignature, isDiditConfigured } from "../didit";

describe("mapDiditStatus", () => {
  it("maps approved -> verified", () => {
    expect(mapDiditStatus("Approved")).toEqual({ verification_status: "verified", id_verified: true });
  });
  it("maps declined/expired/abandoned -> rejected", () => {
    for (const s of ["Declined", "Expired", "KYC Expired", "Abandoned"]) {
      expect(mapDiditStatus(s)).toEqual({ verification_status: "rejected", id_verified: false });
    }
  });
  it("defaults to pending", () => {
    expect(mapDiditStatus("In Review")).toEqual({ verification_status: "pending", id_verified: false });
    expect(mapDiditStatus("")).toEqual({ verification_status: "pending", id_verified: false });
  });
});

describe("verifyWebhookSignature", () => {
  const secret = "whsecret";
  const body = JSON.stringify({ session_id: "abc", status: "Approved" });
  const sign = (b: string) => crypto.createHmac("sha256", secret).update(b, "utf8").digest("hex");

  afterEach(() => {
    delete process.env.DIDIT_WEBHOOK_SECRET;
  });

  it("returns false when no secret configured", () => {
    expect(verifyWebhookSignature(body, sign(body))).toBe(false);
  });
  it("accepts a valid signature", () => {
    process.env.DIDIT_WEBHOOK_SECRET = secret;
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });
  it("rejects a tampered body / wrong signature", () => {
    process.env.DIDIT_WEBHOOK_SECRET = secret;
    expect(verifyWebhookSignature(body + "x", sign(body))).toBe(false);
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
    expect(verifyWebhookSignature(body, null)).toBe(false);
  });
});

describe("isDiditConfigured", () => {
  afterEach(() => {
    delete process.env.DIDIT_API_KEY;
    delete process.env.DIDIT_WORKFLOW_ID;
  });
  it("requires both api key and workflow id", () => {
    expect(isDiditConfigured()).toBe(false);
    process.env.DIDIT_API_KEY = "k";
    expect(isDiditConfigured()).toBe(false);
    process.env.DIDIT_WORKFLOW_ID = "w";
    expect(isDiditConfigured()).toBe(true);
  });
});
