import { describe, expect, it } from "vitest";
import { dedupeEvents, isRelevant, sortEvents, splitJobRows, validateEvent } from "./domain";
import type { RecruitmentEvent } from "./types";

const base: RecruitmentEvent = {
  id: "event-1", title: "国网福建电力专场", eventType: "宣讲会", startAt: "2026-09-25T15:00:00+08:00",
  endAt: null, mode: "线下", venue: "旗山校区", companies: ["国网福建电力"],
  jobs: [{ title: "电气工程师", salary: null, education: "本科", majors: ["电气"], location: "福建", headcount: null }],
  majorTags: ["电气"], applicationUrl: "https://example.com/apply", sourceUrl: "https://example.com/source",
  sourceName: "企业官网", reviewStatus: "approved", reviewedAt: "2026-09-20T09:00:00+08:00", updatedAt: "2026-09-20T09:00:00+08:00",
};

describe("recruitment domain", () => {
  it("keeps relevant and unlimited-major events", () => {
    expect(isRelevant(base)).toBe(true);
    expect(isRelevant({ ...base, id: "2", title: "综合岗位", majorTags: ["不限专业"], jobs: [] })).toBe(true);
    expect(isRelevant({ ...base, id: "3", title: "法务专场", majorTags: ["法学"], jobs: [] })).toBe(false);
  });

  it("puts an active event before future events", () => {
    const active = { ...base, id: "active", startAt: "2026-09-20T09:00:00+08:00", endAt: "2026-09-22T18:00:00+08:00" };
    expect(sortEvents([base, active], new Date("2026-09-21T12:00:00+08:00"))[0]?.id).toBe("active");
  });

  it("deduplicates by source URL and normalized signature", () => {
    expect(dedupeEvents([base, { ...base, id: "copy" }])).toHaveLength(1);
    expect(dedupeEvents([base, { ...base, id: "copy", sourceUrl: "https://other.example/source" }])).toHaveLength(1);
  });

  it("gives every listed role its own salary-bearing row", () => {
    const grouped = [{ ...base.jobs[0]!, title: "研发工程师、设备工程师", salary: "6000–13000元/月" }];
    expect(splitJobRows(grouped).map((job) => [job.title, job.salary])).toEqual([
      ["研发工程师", "6000–13000元/月"],
      ["设备工程师", "6000–13000元/月"],
    ]);

    const distinct = [
      { ...base.jobs[0]!, title: "研发工程师", salary: "10000元/月" },
      { ...base.jobs[0]!, title: "设备工程师", salary: "8000元/月" },
    ];
    expect(splitJobRows(distinct).map((job) => job.salary)).toEqual(["10000元/月", "8000元/月"]);
  });

  it("rejects missing required fields and invalid URLs", () => {
    expect(validateEvent(base)).toBe(true);
    expect(validateEvent({ ...base, title: "" })).toBe(false);
    expect(validateEvent({ ...base, sourceUrl: "javascript:alert(1)" })).toBe(false);
  });
});
