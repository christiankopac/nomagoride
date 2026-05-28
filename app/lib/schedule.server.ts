import * as cheerio from "cheerio";
import { z } from "zod";
import { TTLCache } from "./cache.server";
import { hhmmToMinutes } from "./format";

const RESULTS_URL = "https://vozovnice.nomago.si/results/vozni-red";

export class ScrapeShapeChanged extends Error {
  constructor(message: string) {
    super(`Nomago page shape changed: ${message}`);
    this.name = "ScrapeShapeChanged";
  }
}

const StopSchema = z.object({
  name: z.string(),
  arrival: z.string().nullable(),
  departure: z.string().nullable(),
});

const ScheduleEntrySchema = z.object({
  tripId: z.string(),
  passed: z.boolean(),
  departure: z.object({
    time: z.string(),
    city: z.string(),
  }),
  arrival: z.object({
    time: z.string(),
    city: z.string(),
  }),
  durationMinutes: z.number().int().nonnegative(),
  durationLabel: z.string(),
  transfers: z.number().int().nonnegative(),
  isDirect: z.boolean(),
  stops: z.array(StopSchema),
});

export type Stop = z.infer<typeof StopSchema>;
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

export type ScheduleResult = {
  entries: ScheduleEntry[];
  fetchedAt: string;
  sourceUrl: string;
};

const cache = new TTLCache<string, ScheduleResult>(15 * 60 * 1000, 256);

function parseDurationLine(text: string): {
  minutes: number;
  label: string;
  transfers: number;
  isDirect: boolean;
} {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const hhmmMatch = /(\d{1,2}:\d{2})/.exec(cleaned);
  const hhmm = hhmmMatch?.[1] ?? "";
  const minutes = hhmm ? hhmmToMinutes(hhmm) ?? 0 : 0;
  const lower = cleaned.toLowerCase();
  const isDirect = lower.includes("direktni") || lower.includes("direkten");
  let transfers = 0;
  if (!isDirect) {
    const transferMatch = /(\d+)\s+prestop/.exec(lower);
    if (transferMatch) transfers = Number(transferMatch[1]);
    else transfers = 1;
  }
  return { minutes, label: cleaned, transfers, isDirect };
}

function buildUrl(fromId: string, toId: string, date: string): string {
  const params = new URLSearchParams({
    language: "sl",
    date,
    adults: "1",
    childrens: "0",
    childrens_2: "0",
  });
  return `${RESULTS_URL}/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}?${params}`;
}

function parseHtml(html: string): ScheduleEntry[] {
  const $ = cheerio.load(html);
  const rows = $(".content-box.result");
  if (rows.length === 0) return [];

  const entries: ScheduleEntry[] = [];
  rows.each((_, el) => {
    const row = $(el);
    const depTime = row.find(".result-info.departure .result-info__hour").first().text().trim();
    const depCity = row.find(".result-info.departure .result-info__city").first().text().trim();
    const arrTime = row.find(".result-info.destination .result-info__hour").first().text().trim();
    const arrCity = row.find(".result-info.destination .result-info__city").first().text().trim();
    const durationText = row.find(".result-middle__text").first().text().trim();

    if (!depTime || !arrTime || !depCity || !arrCity || !durationText) {
      throw new ScrapeShapeChanged(
        "missing one of departure/arrival/duration fields in a .content-box.result",
      );
    }

    const stationsContainer = row.find('[id^="mid-stations-"]').first();
    const idAttr = stationsContainer.attr("id") ?? "";
    const tripId = idAttr.replace(/^mid-stations-/, "") || `${depTime}-${arrTime}-${depCity}`;

    const stops: Stop[] = [];
    stationsContainer.find(".stations-row").each((_i, sEl) => {
      const s = $(sEl);
      const name = s.find(".col-6.station").first().text().trim();
      const hours = s.find(".col-3.hour");
      const arrival = hours.eq(0).text().trim() || null;
      const departure = hours.eq(1).text().trim() || null;
      if (name) stops.push({ name, arrival, departure });
    });

    const passed = row.hasClass("passed");
    const duration = parseDurationLine(durationText);

    entries.push({
      tripId,
      passed,
      departure: { time: depTime, city: depCity },
      arrival: { time: arrTime, city: arrCity },
      durationMinutes: duration.minutes,
      durationLabel: duration.label,
      transfers: duration.transfers,
      isDirect: duration.isDirect,
      stops,
    });
  });

  return z.array(ScheduleEntrySchema).parse(entries);
}

export async function getSchedule(args: {
  fromId: string;
  toId: string;
  date: string;
}): Promise<ScheduleResult> {
  const { fromId, toId, date } = args;
  const key = `${fromId}|${toId}|${date}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url = buildUrl(fromId, toId, date);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "NomagoRide/0.1 (+https://github.com/christiankopac/nomagoride)",
      "Accept-Language": "sl",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`nomago page fetch failed: ${res.status}`);
  }
  const html = await res.text();
  const entries = parseHtml(html);

  const result: ScheduleResult = {
    entries,
    fetchedAt: new Date().toISOString(),
    sourceUrl: url,
  };
  cache.set(key, result);
  return result;
}
