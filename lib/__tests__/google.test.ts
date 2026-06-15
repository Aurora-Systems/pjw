import { describe, it, expect, afterEach } from "vitest";
import { consentUrl, isGoogleConfigured } from "../google";

describe("consentUrl", () => {
  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.APP_PUBLIC_URL;
  });

  it("builds a valid Google consent URL with our params", () => {
    process.env.GOOGLE_CLIENT_ID = "client-123.apps.googleusercontent.com";
    process.env.APP_PUBLIC_URL = "https://pocketjobs.co";
    const url = new URL(consentUrl("state-abc"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-123.apps.googleusercontent.com");
    expect(url.searchParams.get("redirect_uri")).toBe("https://pocketjobs.co/api/auth/google/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe("state-abc");
  });

  it("falls back to localhost redirect when APP_PUBLIC_URL unset", () => {
    process.env.GOOGLE_CLIENT_ID = "c";
    const url = new URL(consentUrl("s"));
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/google/callback");
  });
});

describe("isGoogleConfigured", () => {
  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });
  it("requires both client id and secret", () => {
    expect(isGoogleConfigured()).toBe(false);
    process.env.GOOGLE_CLIENT_ID = "id";
    expect(isGoogleConfigured()).toBe(false);
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    expect(isGoogleConfigured()).toBe(true);
  });
});
