import { describe, it, expect } from "vitest";
import { hasContactInfo } from "@/lib/moderation";

describe("hasContactInfo", () => {
  it("flags phone numbers", () => {
    expect(hasContactInfo("call me on 0772 123 456")).toBe(true);
    expect(hasContactInfo("+263 77 1234567")).toBe(true);
  });
  it("flags emails and off-platform keywords", () => {
    expect(hasContactInfo("reach me at me@example.com")).toBe(true);
    expect(hasContactInfo("let's chat on WhatsApp")).toBe(true);
    expect(hasContactInfo("pay me via ecocash")).toBe(true);
  });
  it("passes normal messages", () => {
    expect(hasContactInfo("Hi, are you available on Tuesday morning?")).toBe(false);
    expect(hasContactInfo("The job will take about 2 hours.")).toBe(false);
  });
});
