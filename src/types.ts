export type EventType = "宣讲会" | "双选会";
export type EventMode = "线下" | "线上" | "混合";

export interface Job {
  title: string;
  salary: string | null;
  education: string | null;
  majors: string[];
  location: string | null;
  headcount: number | null;
}

export interface RecruitmentEvent {
  id: string;
  title: string;
  eventType: EventType;
  startAt: string;
  endAt: string | null;
  mode: EventMode;
  venue: string;
  companies: string[];
  jobs: Job[];
  majorTags: string[];
  applicationUrl: string;
  sourceUrl: string;
  sourceName: string;
  reviewStatus: "approved";
  reviewedAt: string;
  updatedAt: string;
}
