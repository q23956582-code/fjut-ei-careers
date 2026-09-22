import "./styles.css";
import "./sources.css";
import "./mobile-fixes.css";
import rawEvents from "./events.json";
import { dedupeEvents, isRelevant, sortEvents, validateEvent } from "./domain";
import type { RecruitmentEvent } from "./types";

const events = sortEvents((rawEvents as RecruitmentEvent[]).filter(validateEvent).filter(isRelevant));
const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app root");

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
const dateLabel = (iso: string) => {
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric" }).formatToParts(new Date(iso));
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${month}月${day}日`;
};
const weekday = (iso: string) => new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", weekday: "long" }).format(new Date(iso));
const timeLabel = (iso: string) => new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

function groupByDate(items: RecruitmentEvent[]): Map<string, RecruitmentEvent[]> {
  const groups = new Map<string, RecruitmentEvent[]>();
  items.forEach((event) => {
    const label = dateLabel(event.startAt);
    groups.set(label, [...(groups.get(label) ?? []), event]);
  });
  return groups;
}

app.innerHTML = `
  <header><div class="wrap nav"><div class="identity"><span class="mark">EI</span><span><b>电气与信息工程学院就业日历</b><small>福建理工大学</small></span></div><nav><a href="#events">招聘活动</a><a href="#sources">信息来源</a><span>持续更新</span></nav></div></header>
  <main class="wrap"><section class="intro"><div><h1>近期招聘活动</h1><p>已筛选电气、电力电子、智能控制、电子信息、通信、微电子、嵌入式开发、理工科及不限专业岗位。</p></div><aside><b>2026 秋季</b><span>按活动开始时间排序</span></aside></section>
  <section class="toolbar" aria-label="活动筛选"><input id="search" type="search" placeholder="搜索企业、岗位或地点" aria-label="搜索企业、岗位或地点"><select id="major" aria-label="专业方向"><option value="">全部专业</option>${[...new Set(events.flatMap((event) => event.majorTags))].map((tag) => `<option>${esc(tag)}</option>`).join("")}</select><select id="type" aria-label="活动类型"><option value="">全部类型</option><option>宣讲会</option><option>双选会</option></select></section>
  <section id="events" class="timeline" aria-live="polite"></section>
  <section id="sources" class="sources"><div><h2>信息来源</h2><p>活动经人工审核后发布，最终安排以企业或主办方官方通知为准。</p></div><ul><li><a href="https://fjut.jysd.com/" target="_blank" rel="noopener noreferrer">福建理工大学就业网</a></li><li><a href="https://www.fj99.org.cn/bys/" target="_blank" rel="noopener noreferrer">福建就业网</a></li><li>企业官网及公开招聘通知</li></ul></section></main>
  <dialog id="details"><button class="dialog-close" aria-label="关闭详情">关闭</button><div id="detail-content"></div></dialog>`;

const timeline = document.querySelector<HTMLElement>("#events")!;
const search = document.querySelector<HTMLInputElement>("#search")!;
const major = document.querySelector<HTMLSelectElement>("#major")!;
const type = document.querySelector<HTMLSelectElement>("#type")!;
const dialog = document.querySelector<HTMLDialogElement>("#details")!;
const detailContent = document.querySelector<HTMLElement>("#detail-content")!;

function render(): void {
  const query = search.value.trim().toLowerCase();
  const filtered = dedupeEvents(events).filter((event) => {
    const haystack = [event.title, event.venue, ...event.companies, ...event.majorTags, ...event.jobs.map((job) => job.title)].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!major.value || event.majorTags.includes(major.value)) && (!type.value || event.eventType === type.value);
  });
  if (!filtered.length) {
    timeline.innerHTML = `<div class="empty"><b>没有找到符合条件的活动</b><span>请更换关键词或清除筛选条件。</span><button id="clear">清除筛选</button></div>`;
    document.querySelector<HTMLButtonElement>("#clear")?.addEventListener("click", () => { search.value = ""; major.value = ""; type.value = ""; render(); });
    return;
  }
  const groups = groupByDate(filtered);
  timeline.innerHTML = [...groups.entries()].map(([date, dayEvents]) => `<article class="day"><div class="date"><b>${esc(date)}</b><span>${esc(weekday(dayEvents[0]!.startAt))}</span></div><div class="rail"></div><div class="events">${dayEvents.map(eventMarkup).join("")}</div></article>`).join("");
  timeline.querySelectorAll<HTMLButtonElement>("[data-event]").forEach((button) => button.addEventListener("click", () => showDetails(button.dataset.event!)));
}

function eventMarkup(event: RecruitmentEvent): string {
  const job = event.jobs[0];
  const jobLine = job ? `<div class="roles"><b>${esc(job.title)}</b><span>${esc(job.salary ?? "薪酬未公布")}</span><span>${esc(job.education ?? "学历未公布")}</span></div>` : "";
  return `<div class="event"><div class="time"><b>${timeLabel(event.startAt)}</b><span>${esc(event.mode)}${esc(event.eventType)}</span></div><div><h2>${esc(event.title)}</h2><div class="meta"><span>${esc(event.venue)}</span><span>${esc(event.majorTags.join("、"))}</span></div>${jobLine}<div class="verified">信息已核验 <span>以企业或主办方官方通知为准</span></div></div><button class="detail-button" data-event="${esc(event.id)}">查看详情</button></div>`;
}

function showDetails(id: string): void {
  const event = events.find((item) => item.id === id);
  if (!event) return;
  const jobs = event.jobs;
  const jobList = jobs.length ? `<div class="job-list">${jobs.map((job) => `<section class="job"><b>${esc(job.title)}</b><span class="job-salary">${esc(job.salary ?? "薪酬未公布")}</span><p>${esc(job.education ?? "学历未公布")} · ${esc(job.location ?? "工作地点未公布")}</p><p class="job-majors"><span>需求专业</span>${esc(job.majors.join("、") || "未公布")}</p></section>`).join("")}</div>` : `<p>岗位信息未公布。</p>`;
  detailContent.innerHTML = `<p class="detail-type">${esc(event.eventType)} / ${esc(event.mode)}</p><h2>${esc(event.title)}</h2><dl><div><dt>时间</dt><dd>${esc(dateLabel(event.startAt))} ${esc(timeLabel(event.startAt))}</dd></div><div><dt>地点</dt><dd>${esc(event.venue)}</dd></div><div><dt>企业</dt><dd>${esc(event.companies.join("、") || "未公布")}</dd></div><div><dt>专业</dt><dd>${esc(event.majorTags.join("、"))}</dd></div></dl><h3>招聘岗位</h3>${jobList}<div class="detail-actions"><a href="${esc(event.applicationUrl)}" target="_blank" rel="noopener noreferrer">打开网申入口</a><a href="${esc(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看原始来源</a></div><p class="source">来源：${esc(event.sourceName)}。信息以官方通知为准</p>`;
  dialog.showModal();
}

document.querySelector<HTMLButtonElement>(".dialog-close")!.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
[search, major, type].forEach((control) => control.addEventListener("input", render));
render();
