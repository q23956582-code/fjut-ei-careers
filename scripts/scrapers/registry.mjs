import { fj99Adapter } from "./fj99.mjs";
import { fzuAdapter } from "./fzu.mjs";
import { fjutAdapter } from "./fjut.mjs";

export const adapters = [fjutAdapter, fj99Adapter, fzuAdapter];

export const pendingSources = [
  { name: "闽江学院就业信息网", url: "http://job.mju.edu.cn/", status: "site-access-adapter-pending" },
  { name: "福建农林大学就业信息网", url: "http://career.fafu.edu.cn/", status: "site-timeout-adapter-pending" },
];
