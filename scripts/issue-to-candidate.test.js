import { describe, expect, it } from "vitest";
import { buildCandidate, parseSections } from "./issue-to-candidate.mjs";

const manualBody = `### 活动名称
测试宣讲会
### 活动类型
宣讲会
### 开始时间
2026-10-01 14:30
### 结束时间
_No response_
### 举办方式
线下
### 地点或线上平台
博学楼
### 企业名称
测试企业
### 招聘岗位
电气工程师
### 专业要求
电气，自动化
### 网申或报名链接
https://example.com/apply
### 原始来源链接
https://example.com/source
### 来源名称
企业官网`;

describe("issue candidate conversion", () => {
  it("parses issue-form sections", () => expect(parseSections(manualBody)["活动名称"]).toBe("测试宣讲会"));
  it("builds a draft event", () => {
    const result = buildCandidate({ body: manualBody, issueNumber: 12, labels: ["recruitment-entry"] });
    expect(result).toMatchObject({ id: "issue-12", reviewStatus: "draft", majorTags: ["电气", "自动化"] });
  });
  it("rejects unsafe links", () => expect(() => buildCandidate({ body: manualBody.replace("https://example.com/source", "javascript:alert(1)"), issueNumber: 13, labels: ["recruitment-entry"] })).toThrow());
});
