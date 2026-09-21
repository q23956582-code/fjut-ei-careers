import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export function parseSections(body) {
  const result = {};
  const parts = body.split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const [heading = "", ...content] = part.split("\n");
    result[heading.trim()] = content.join("\n").trim().replace(/^_No response_$/i, "");
  }
  return result;
}

const cleanList = (value = "") => value.split(/[、，,]/).map((item) => item.trim()).filter(Boolean);
const toIso = (value) => value ? `${value.trim().replace(" ", "T")}:00+08:00` : null;
const assertWebUrl = (value, field) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`${field} must use http or https`);
  return url.href;
};

export function buildCandidate({ body, issueNumber, labels }) {
  const fields = parseSections(body);
  const sourceOnly = labels.includes("recruitment-source");
  if (sourceOnly) {
    return { id: `source-${issueNumber}`, submissionType: "source-link", sourceUrl: assertWebUrl(fields["招聘信息链接"], "sourceUrl"), notes: fields["已知信息"] ?? "", reviewStatus: "draft", issueNumber };
  }
  const startAt = toIso(fields["开始时间"]);
  if (!startAt || !Number.isFinite(Date.parse(startAt))) throw new Error("开始时间格式必须为 YYYY-MM-DD HH:mm");
  const applicationUrl = assertWebUrl(fields["网申或报名链接"], "applicationUrl");
  const sourceUrl = assertWebUrl(fields["原始来源链接"], "sourceUrl");
  const jobs = (fields["招聘岗位"] ?? "").split("\n").map((line) => line.trim()).filter(Boolean).map((title) => ({ title, salary: null, education: null, majors: cleanList(fields["专业要求"]), location: null, headcount: null }));
  return {
    id: `issue-${issueNumber}`, title: fields["活动名称"], eventType: fields["活动类型"], startAt,
    endAt: toIso(fields["结束时间"]), mode: fields["举办方式"], venue: fields["地点或线上平台"],
    companies: [fields["企业名称"]].filter(Boolean), jobs, majorTags: cleanList(fields["专业要求"]),
    applicationUrl, sourceUrl, sourceName: fields["来源名称"], reviewStatus: "draft", issueNumber,
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const issueNumber = Number(process.env.ISSUE_NUMBER);
  const labels = JSON.parse(process.env.ISSUE_LABELS ?? "[]");
  const candidate = buildCandidate({ body: process.env.ISSUE_BODY ?? "", issueNumber, labels });
  const directory = resolve("data", "candidates");
  await mkdir(directory, { recursive: true });
  const output = resolve(directory, `issue-${issueNumber}.json`);
  await writeFile(output, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
  console.log(output);
}
