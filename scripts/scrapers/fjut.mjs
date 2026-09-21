import { Buffer } from "node:buffer";
import { inflateSync } from "node:zlib";
import * as cheerio from "cheerio";

const SITE_ORIGIN = "https://fjut.jysd.com";

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeList(html) {
  for (const match of html.matchAll(/unzip\("([A-Za-z0-9+/=]+)"\)/g)) {
    try {
      const inflated = inflateSync(Buffer.from(match[1], "base64")).toString("utf8");
      if (!inflated.startsWith("view2d")) continue;
      const encoded = inflated.replace(/^view2d\s+/, "");
      return Buffer.from(encoded, "base64").toString("utf8").replace(/^view1d\s+/, "");
    } catch {
      // Other embedded blocks may use a different payload; keep looking for the list.
    }
  }
  return html;
}

export function parseFjutTalks(html) {
  const $ = cheerio.load(decodeList(html));
  const candidates = [];

  $("ul.infoList.teachinList").each((_, element) => {
    const row = $(element);
    const anchor = row.find("a[href*='/teachin/view/id/']").first();
    const href = anchor.attr("href");
    const title = normalize(anchor.text());
    const venue = normalize(row.find("li.span5").text());
    const dateText = normalize(row.find("li").last().text());
    const match = dateText.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})-(\d{2}:\d{2})/);
    if (!href || !title || !match) return;

    const sourceUrl = new URL(href, SITE_ORIGIN).href;
    candidates.push({
      id: `fjut-${sourceUrl.split("/").at(-1)}`,
      title,
      eventType: "宣讲会",
      startAt: `${match[1]}T${match[2]}:00+08:00`,
      endAt: `${match[1]}T${match[3]}:00+08:00`,
      mode: normalize(row.find(".status-text").text()).includes("线上") ? "线上" : "线下",
      venue: venue || "未公布",
      companies: [],
      jobs: [],
      majorTags: [],
      applicationUrl: sourceUrl,
      sourceUrl,
      sourceName: "福建理工大学就业网",
      reviewStatus: "draft",
      needsMajorReview: true,
    });
  });

  return candidates;
}

export const fjutAdapter = {
  id: "fjut",
  name: "福建理工大学就业网",
  url: "https://fjut.jysd.com/teachin/index/domain/fjut/a/y",
  parse: parseFjutTalks,
};
