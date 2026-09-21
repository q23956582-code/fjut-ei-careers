import { fj99Adapter } from "./fj99.mjs";

export const adapters = [fj99Adapter];

export const pendingSources = [
  { name: "福建理工大学就业网", url: "https://fjut.jysd.com/", status: "dynamic-site-adapter-pending" },
  { name: "福州大学人才招聘相关页面", url: "http://fjrclh.fzu.edu.cn/", status: "site-timeout-adapter-pending" },
  { name: "闽江学院就业信息网", url: "http://job.mju.edu.cn/", status: "site-access-adapter-pending" },
  { name: "福建农林大学就业信息网", url: "http://career.fafu.edu.cn/", status: "site-timeout-adapter-pending" },
];
