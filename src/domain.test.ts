import { describe, expect, it } from "vitest";
import rawEvents from "./events.json";
import { dedupeEvents, isRelevant, sortEvents, summarizeEducation, validateEvent } from "./domain";
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

  it("keeps verified salary and major requirements on every published job", () => {
    const events = rawEvents as RecruitmentEvent[];
    const jinjiang = events.find((event) => event.id === "fjut-jinjiang-210169")!;
    expect(jinjiang.jobs).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "研发工程师", salary: "8000–13000元/月", majors: ["微电子科学与工程", "电子信息工程"] }),
      expect.objectContaining({ title: "设备助理工程师", salary: "6000–10000元/月", majors: ["机械设计制造及其自动化", "电气工程及其自动化"] }),
    ]));
    for (const event of events.filter(isRelevant)) {
      expect(event.jobs.length, event.title).toBeGreaterThan(0);
      event.jobs.forEach((job) => expect(job.majors.length, `${event.title} / ${job.title}`).toBeGreaterThan(0));
    }
  });

  it("summarizes education requirements across all jobs in an event", () => {
    const job = base.jobs[0]!;
    expect(summarizeEducation([{ ...job, education: "本科" }])).toBe("本科及以上");
    expect(summarizeEducation([{ ...job, education: "本科" }, { ...job, education: "硕士" }])).toBe("本科、研究生");
    expect(summarizeEducation([{ ...job, education: "博士" }])).toBe("研究生");
    expect(summarizeEducation([{ ...job, education: "不限" }])).toBe("学历不限");
    expect(summarizeEducation([{ ...job, education: null }])).toBe("未公布");
  });

  it("includes the verified Xiamen job fair and only its relevant jobs", () => {
    const event = (rawEvents as RecruitmentEvent[]).find((item) => item.id === "xiamen-tongan-fjut-20260923")!;
    expect(event).toMatchObject({
      eventType: "双选会",
      startAt: "2026-09-23T14:30:00+08:00",
      endAt: "2026-09-23T17:00:00+08:00",
      venue: "福建理工大学旗山校区北区风雨篮球场",
    });
    expect(event.companies).toHaveLength(55);
    expect(event.jobs).toHaveLength(126);
    expect(event.jobs[0]).toMatchObject({
      title: "C++开发工程师（初级）",
      company: "昇捷丰标识科技（厦门）有限公司",
    });
    expect(event.jobs.every((job) => Boolean(job.company))).toBe(true);
    expect(event.majorTags).toEqual(["电气/能源/动力类", "电子/通信/自动化", "理工科", "不限专业"]);
    expect(summarizeEducation(event.jobs)).toBe("本科、研究生");
  });

  it("rejects missing required fields and invalid URLs", () => {
    expect(validateEvent(base)).toBe(true);
    expect(validateEvent({ ...base, title: "" })).toBe(false);
    expect(validateEvent({ ...base, sourceUrl: "javascript:alert(1)" })).toBe(false);
  });
});
