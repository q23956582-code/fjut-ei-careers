import { describe, expect, it } from "vitest";
import { parseFzuTalks } from "./fzu.mjs";

describe("parseFzuTalks", () => {
  it("collects a dated campus talk for later major review", () => {
    const html = `<a href="../cms/xjhdetail.html?id=abc123">
      <div class="xjhinfo">芯联集成电路制造股份有限公司专场宣讲会</div>
      <span class="xjhtype"><span>学生活动中心多功能厅</span></span>
      <span class="xjhtype"><span>2026.09.22 15:00-17:00</span></span>
    </a>`;

    expect(parseFzuTalks(html)).toEqual([
      expect.objectContaining({
        id: "fzu-abc123",
        title: "芯联集成电路制造股份有限公司专场宣讲会",
        startAt: "2026-09-22T15:00:00+08:00",
        endAt: "2026-09-22T17:00:00+08:00",
        venue: "学生活动中心多功能厅",
        reviewStatus: "draft",
        needsMajorReview: true,
      }),
    ]);
  });
});
