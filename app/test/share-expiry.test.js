import { describe, expect, it } from "vitest";
import { shareDaysRemaining } from "../src/modules/share-expiry.js";

describe("share expiry labels", () => {
  const now = 1_000_000;

  it("rounds any active partial day up", () => {
    expect(shareDaysRemaining(now + 1, now)).toBe(1);
    expect(shareDaysRemaining(now + 12 * 60 * 60 * 1000, now)).toBe(1);
    expect(shareDaysRemaining(now + 24 * 60 * 60 * 1000 + 1, now)).toBe(2);
  });

  it("returns zero only after the link expires", () => {
    expect(shareDaysRemaining(now, now)).toBe(0);
    expect(shareDaysRemaining(now - 1, now)).toBe(0);
  });

  it("reports missing expiry as unknown", () => {
    expect(shareDaysRemaining(undefined, now)).toBeNull();
    expect(shareDaysRemaining(null, now)).toBeNull();
    expect(shareDaysRemaining("", now)).toBeNull();
  });
});
