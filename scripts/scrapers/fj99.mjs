import * as cheerio from "cheerio";

const SITE_ORIGIN = "https://www.fj99.org.cn";

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseDateRange(text) {
  const match = text.match(/举办时间[：:]\s*(\d{4}-\d{2}-\d{2})(?:\s*至\s*(\d{4}-\d{2}-\d{2}))?/);
  if (!match) return null;
  return {
    startAt: `${match[1]}T00:00:00+08:00`,
    endAt: match[2] ? `${match[2]}T23:59:59+08:00` : null,
  };
}

export function parseFj99List(html) {
  const $ = cheerio.load(html);
  const candidates = [];
  const seen = new Set();
  $("a[href*='cb33zph.msw?id=']").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const title = normalize(anchor.text());
    if (!href || !title) return;
    const sourceUrl = new URL(href, SITE_ORIGIN).href;
    if (seen.has(sourceUrl)) return;
    const container = anchor.closest("li, article, .item, .list-item");
    const context = normalize((container.length ? container : anchor.parent()).text());
    const dates = parseDateRange(context);
    if (!dates) return;
    const venue = context.match(/举办场馆[：:]\s*([^举办]+?)(?=\s*举办时间|$)/)?.[1]?.trim() || "未公布";
    seen.add(sourceUrl);
    candidates.push({
      id: `fj99-${new URL(sourceUrl).searchParams.get("id")}`,
      title,
      eventType: title.includes("双选") ? "双选会" : "宣讲会",
      ...dates,
      mode: title.includes("线上") || title.includes("网络") ? "线上" : "线下",
      venue,
      companies: [],
      jobs: [],
      majorTags: [],
      applicationUrl: sourceUrl,
      sourceUrl,
      sourceName: "福建就业网",
      reviewStatus: "draft",
      needsMajorReview: true,
    });
  });
  return candidates;
}

export const fj99Adapter = {
  id: "fj99",
  name: "福建就业网",
  url: "https://www.fj99.org.cn/job/cb33zphs.msw",
  parse: parseFj99List,
};
