import crypto from "crypto";

/**
 * Pesepay (https://pesepay.co.zw) payment gateway client.
 *
 * Wire contract (from Pesepay's official SDKs):
 *  - Base: https://api.pesepay.com/api/payments-engine/
 *  - Header: `authorization: <INTEGRATION_KEY>`
 *  - Request/response bodies are `{ "payload": "<AES-256-CBC base64>" }`.
 *    AES-256-CBC, key = ENCRYPTION_KEY (32 chars, utf8), IV = first 16 chars of the
 *    key, PKCS7 padding, base64 ciphertext (byte-compatible with their crypto-js usage).
 *  - Redirect/hosted checkout: POST v1/payments/initiate -> { redirectUrl, pollUrl, referenceNumber }.
 *  - Status: GET v1/payments/check-payment?referenceNumber=... -> { transactionStatus, paid, ... }.
 */

const BASE_URL = "https://api.pesepay.com/api/payments-engine/";

function keys() {
  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY;
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY;
  if (!integrationKey || !encryptionKey) {
    throw new Error(
      "Pesepay is not configured. Set PESEPAY_INTEGRATION_KEY and PESEPAY_ENCRYPTION_KEY."
    );
  }
  return { integrationKey, encryptionKey };
}

export function isPesepayConfigured(): boolean {
  return Boolean(process.env.PESEPAY_INTEGRATION_KEY && process.env.PESEPAY_ENCRYPTION_KEY);
}

function encrypt(data: unknown, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "utf8"); // 32 bytes -> AES-256
  const iv = Buffer.from(encryptionKey.slice(0, 16), "utf8"); // first 16 chars
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]).toString("base64");
}

function decrypt<T = Record<string, unknown>>(payload: string, encryptionKey: string): T {
  const key = Buffer.from(encryptionKey, "utf8");
  const iv = Buffer.from(encryptionKey.slice(0, 16), "utf8");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const out = Buffer.concat([
    decipher.update(Buffer.from(payload, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(out) as T;
}

export interface PesepayTransaction {
  referenceNumber: string;
  pollUrl: string;
  redirectUrl: string;
  redirectRequired?: boolean;
  paid?: boolean;
  transactionStatus?: string;
  transactionStatusDescription?: string;
  amountDetails?: { amount: number; currencyCode: string };
}

async function call(path: string, method: "GET" | "POST", body?: unknown): Promise<PesepayTransaction> {
  const { integrationKey, encryptionKey } = keys();
  const init: RequestInit = {
    method,
    headers: { authorization: integrationKey, "content-type": "application/json" },
  };
  if (body !== undefined) init.body = JSON.stringify({ payload: encrypt(body, encryptionKey) });

  const res = await fetch(`${BASE_URL}${path}`, init);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.payload) {
    const msg = json?.message || `Pesepay request failed (${res.status})`;
    throw new Error(msg);
  }
  return decrypt<PesepayTransaction>(json.payload, encryptionKey);
}

/** Initiate a redirect/hosted-checkout transaction. */
export function initiateTransaction(input: {
  amount: number;
  currencyCode: string;
  reasonForPayment: string;
  returnUrl: string;
  resultUrl: string;
  merchantReference?: string;
}): Promise<PesepayTransaction> {
  return call("v1/payments/initiate", "POST", {
    amountDetails: { amount: input.amount, currencyCode: input.currencyCode },
    reasonForPayment: input.reasonForPayment,
    returnUrl: input.returnUrl,
    resultUrl: input.resultUrl,
    merchantReference: input.merchantReference,
  });
}

/** Check a transaction's status by reference number. */
export function checkPayment(referenceNumber: string): Promise<PesepayTransaction> {
  return call(`v1/payments/check-payment?referenceNumber=${encodeURIComponent(referenceNumber)}`, "GET");
}

/** Map Pesepay transactionStatus -> our payment status. */
export function mapStatus(t: PesepayTransaction): "pending" | "paid" | "failed" | "cancelled" {
  if (t.paid || t.transactionStatus === "SUCCESS") return "paid";
  const s = t.transactionStatus ?? "";
  if (["PENDING", "PROCESSING", "INITIATED"].includes(s)) return "pending";
  if (["CANCELLED", "CLOSED", "CLOSED_PERIOD_ELAPSED", "TERMINATED"].includes(s)) return "cancelled";
  return "failed";
}
