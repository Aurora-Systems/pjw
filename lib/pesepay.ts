import crypto from "crypto";
import https from "node:https";

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

export function encrypt(data: unknown, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "utf8"); // 32 bytes -> AES-256
  const iv = Buffer.from(encryptionKey.slice(0, 16), "utf8"); // first 16 chars
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]).toString("base64");
}

export function decrypt<T = Record<string, unknown>>(payload: string, encryptionKey: string): T {
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

/**
 * Pesepay's API returns slightly non-RFC-compliant HTTP responses (a missing CR in a
 * header) that Node's built-in fetch (undici) rejects outright with "fetch failed",
 * even though the request succeeded server-side. We use the core https client with
 * `insecureHTTPParser` to tolerate it — the same leniency curl has.
 */
function httpRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    // We use insecureHTTPParser for Pesepay's non-compliant responses; restrict that leniency
    // to the Pesepay host only so a bad/injected URL can't point it elsewhere (SSRF guard).
    if (u.protocol !== "https:" || u.hostname !== "api.pesepay.com") {
      reject(new Error(`Refusing non-Pesepay request to ${u.hostname}`));
      return;
    }
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method,
        headers,
        insecureHTTPParser: true,
        timeout: 20000,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode || 0, text: data }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Pesepay request timed out")));
    if (body) req.write(body);
    req.end();
  });
}

async function call(path: string, method: "GET" | "POST", body?: unknown): Promise<PesepayTransaction> {
  const { integrationKey, encryptionKey } = keys();
  const headers: Record<string, string> = {
    authorization: integrationKey,
    "content-type": "application/json",
  };
  let payload: string | undefined;
  if (body !== undefined) {
    payload = JSON.stringify({ payload: encrypt(body, encryptionKey) });
    headers["content-length"] = String(Buffer.byteLength(payload));
  }

  const res = await httpRequest(`${BASE_URL}${path}`, method, headers, payload);
  let json: { payload?: string; message?: string } | null = null;
  try {
    json = res.text ? JSON.parse(res.text) : null;
  } catch {
    json = null;
  }
  if (res.status < 200 || res.status >= 300 || !json?.payload) {
    throw new Error(json?.message || `Pesepay request failed (${res.status})`);
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

/**
 * The amount Pesepay confirms was actually paid, in USD — or null if it's missing
 * or in another currency. Use this (not the amount we requested) to credit wallets,
 * so a gateway/amount mismatch can't be silently credited at the requested value.
 */
export function confirmedUsdAmount(t: PesepayTransaction): number | null {
  const a = t.amountDetails?.amount;
  const c = t.amountDetails?.currencyCode;
  if (a == null || !(a > 0)) return null;
  if (c && c !== "USD") return null;
  return a;
}
