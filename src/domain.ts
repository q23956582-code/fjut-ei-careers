import type { Job, RecruitmentEvent } from "./types";

export const TARGET_KEYWORDS = [
  "电气", "电力电子", "智能控制", "新一代电子信息技术", "自动化", "电子信息",
  "电子类", "通信", "微电子", "嵌入式", "半导体", "理工科", "不限专业", "专业不限",
];

export function isRelevant(event: RecruitmentEvent): boolean {
  const text = [event.title, ...event.majorTags, ...event.jobs.flatMap((job) => [job.title, ...job.majors])].join(" ");
  return TARGET_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function sortEvents(events: RecruitmentEvent[], now = new Date()): RecruitmentEvent[] {
  const timestamp = now.getTime();
  return [...events].sort((a, b) => {
    const aStart = Date.parse(a.startAt);
    const bStart = Date.parse(b.startAt);
    const aEnd = Date.parse(a.endAt ?? a.startAt);
    const bEnd = Date.parse(b.endAt ?? b.startAt);
    const aActive = aStart <= timestamp && aEnd >= timestamp;
    const bActive = bStart <= timestamp && bEnd >= timestamp;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return aStart - bStart;
  });
}

export function dedupeEvents(events: RecruitmentEvent[]): RecruitmentEvent[] {
  const seenSources = new Set<string>();
  const seenSignatures = new Set<string>();
  return events.filter((event) => {
    const signature = [event.title.trim().toLowerCase(), event.startAt, event.venue.trim().toLowerCase()].join("|");
    if (seenSources.has(event.sourceUrl) || seenSignatures.has(signature)) return false;
    seenSources.add(event.sourceUrl);
    seenSignatures.add(signature);
    return true;
  });
}

export function summarizeEducation(jobs: Job[]): string {
  const values = jobs.map((job) => job.education ?? "");
  if (values.some((value) => value.includes("不限"))) return "学历不限";
  const hasUndergraduate = values.some((value) => value.includes("本科"));
  const hasGraduate = values.some((value) => /硕士|博士|研究生/.test(value));
  if (hasUndergraduate && hasGraduate) return "本科、研究生";
  if (hasGraduate) return "研究生";
  if (hasUndergraduate) return "本科及以上";
  return "未公布";
}

export function validateEvent(value: unknown): value is RecruitmentEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<RecruitmentEvent>;
  if (!event.id || !event.title || !event.startAt || !event.sourceUrl) return false;
  if (!Number.isFinite(Date.parse(event.startAt))) return false;
  try {
    const source = new URL(event.sourceUrl);
    const application = new URL(event.applicationUrl ?? "");
    return [source.protocol, application.protocol].every((protocol) => protocol === "https:" || protocol === "http:");
  } catch {
    return false;
  }
}
