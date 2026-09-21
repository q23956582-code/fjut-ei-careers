import * as cheerio from "cheerio";

const SITE_ORIGIN = "http://fjrclh.fzu.edu.cn";

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function parseFzuTalks(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  $("a[href*='xjhdetail.html?id=']").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const title = normalize(anchor.find(".xjhinfo").text());
    const details = anchor.find(".xjhtype span").map((__, node) => normalize($(node).text())).get();
    const dateText = details.find((value) => /^\d{4}\.\d{2}\.\d{2}/.test(value));
    const venue = details.find((value) => value !== dateText);
    const match = dateText?.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!href || !title || !match) return;

    const sourceUrl = new URL(href, `${SITE_ORIGIN}/cmss/`).href;
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    candidates.push({
      id: `fzu-${new URL(sourceUrl).searchParams.get("id")}`,
      title,
      eventType: "宣讲会",
      startAt: `${date}T${match[4]}:00+08:00`,
      endAt: `${date}T${match[5]}:00+08:00`,
      mode: venue?.includes("空中宣讲") ? "线上" : "线下",
      venue: venue || "未公布",
      companies: [],
      jobs: [],
      majorTags: [],
      applicationUrl: sourceUrl,
      sourceUrl,
      sourceName: "福建人才联合网（福州大学）",
      reviewStatus: "draft",
      needsMajorReview: true,
    });
  });

  return candidates;
}

export const fzuAdapter = {
  id: "fzu",
  name: "福建人才联合网（福州大学）",
  url: "http://fjrclh.fzu.edu.cn/cmss/xjh",
  parse: parseFzuTalks,
};
