import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { newKey, publicUrl, keyFromPublicUrl, isOurUploadUrl, isR2Configured } from "../r2";

// PREFIX is captured at module load from R2_KEY_PREFIX || "uploads"; we don't set
// R2_KEY_PREFIX, so the prefix under test is the default "uploads".
const BASE = "https://cdn.pocketjobs.co";

describe("newKey", () => {
  it("builds uploads/<kind>/<uuid>.<ext> with the right extension", () => {
    expect(newKey("avatar", "image/png")).toMatch(
      /^uploads\/avatar\/[0-9a-f-]{36}\.png$/
    );
    expect(newKey("job", "image/jpeg")).toMatch(/^uploads\/job\/[0-9a-f-]{36}\.jpg$/);
    expect(newKey("review", "image/webp")).toMatch(/^uploads\/review\/[0-9a-f-]{36}\.webp$/);
  });

  it("sanitizes the kind and falls back when empty/unsafe", () => {
    expect(newKey("../../etc", "image/png")).toMatch(/^uploads\/etc\/[0-9a-f-]{36}\.png$/);
    expect(newKey("", "image/gif")).toMatch(/^uploads\/other\/[0-9a-f-]{36}\.gif$/);
  });

  it("produces unique keys", () => {
    expect(newKey("avatar", "image/png")).not.toBe(newKey("avatar", "image/png"));
  });
});

describe("publicUrl / keyFromPublicUrl / isOurUploadUrl", () => {
  beforeEach(() => {
    process.env.R2_PUBLIC_BASE_URL = BASE;
  });
  afterEach(() => {
    delete process.env.R2_PUBLIC_BASE_URL;
  });

  it("publicUrl joins base + key", () => {
    expect(publicUrl("uploads/avatar/x.png")).toBe(`${BASE}/uploads/avatar/x.png`);
  });

  it("keyFromPublicUrl reverses publicUrl and rejects foreign URLs", () => {
    const key = "uploads/job/abc.jpg";
    expect(keyFromPublicUrl(publicUrl(key))).toBe(key);
    expect(keyFromPublicUrl("https://evil.example.com/uploads/x.jpg")).toBeNull();
    expect(keyFromPublicUrl(null)).toBeNull();
    expect(keyFromPublicUrl(`${BASE}`)).toBeNull(); // no trailing slash -> not a key
  });

  it("isOurUploadUrl accepts only our base + prefix", () => {
    expect(isOurUploadUrl(`${BASE}/uploads/avatar/x.png`)).toBe(true);
    // right host, wrong prefix (e.g. the marketing web_assets/ folder)
    expect(isOurUploadUrl(`${BASE}/web_assets/logo.png`)).toBe(false);
    // foreign host
    expect(isOurUploadUrl("https://lh3.googleusercontent.com/a/avatar")).toBe(false);
    // injection attempts
    expect(isOurUploadUrl("javascript:alert(1)")).toBe(false);
    expect(isOurUploadUrl("")).toBe(false);
    expect(isOurUploadUrl(null)).toBe(false);
  });
});

describe("isR2Configured", () => {
  const keys = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"];
  afterEach(() => keys.forEach((k) => delete process.env[k]));

  it("is false until every var is set", () => {
    expect(isR2Configured()).toBe(false);
    keys.forEach((k, i) => {
      process.env[k] = "v";
      // true only once the last one is set
      expect(isR2Configured()).toBe(i === keys.length - 1);
    });
  });
});
