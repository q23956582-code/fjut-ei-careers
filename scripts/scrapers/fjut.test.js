import { Buffer } from "node:buffer";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { parseFjutTalks } from "./fjut.mjs";

describe("parseFjutTalks", () => {
  it("decodes the embedded list and keeps events for major review", () => {
    const list = `view1d <ul class="infoList teachinList">
      <li class="span8"><span class="status-text">线下</span><a href="/teachin/view/id/210257">特来电新能源股份有限公司</a></li>
      <li class="span5">大教－西3</li><li>2026-10-22 14:00-17:00（周四）</li>
    </ul>`;
    const encodedList = Buffer.from(list).toString("base64");
    const payload = deflateSync(`view2d ${encodedList}`).toString("base64");
    const html = `<script>$("#content").replaceWith(Base64.decode(unzip("${payload}")))</script>`;

    expect(parseFjutTalks(html)).toEqual([
      expect.objectContaining({
        id: "fjut-210257",
        title: "特来电新能源股份有限公司",
        startAt: "2026-10-22T14:00:00+08:00",
        endAt: "2026-10-22T17:00:00+08:00",
        venue: "大教－西3",
        reviewStatus: "draft",
        needsMajorReview: true,
      }),
    ]);
  });
});
