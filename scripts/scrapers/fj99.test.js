import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFj99List } from "./fj99.mjs";

const fixture = readFileSync(new URL("./fixtures/fj99-list.html", import.meta.url), "utf8");

describe("Fujian employment fair parser", () => {
  it("extracts stable event fields from a saved page", () => {
    const events = parseFj99List(fixture);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ id: "fj99-abc123", eventType: "双选会", mode: "线上", startAt: "2026-10-08T00:00:00+08:00", reviewStatus: "draft", needsMajorReview: true });
    expect(events[1]?.venue).toBe("海峡国际会展中心");
  });

  it("ignores entries without a valid date", () => {
    expect(parseFj99List('<a href="/job/cb33zph.msw?id=bad">无日期活动</a>')).toEqual([]);
  });
});
