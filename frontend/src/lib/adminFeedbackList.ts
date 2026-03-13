export const ADMIN_FEEDBACK_PAGE_SIZE = 10;
export const DEFAULT_ADMIN_FEEDBACK_TAB = "unreplied";
export const DEFAULT_ADMIN_FEEDBACK_STATUS = "all";

export const ADMIN_FEEDBACK_TABS = [
  { label: "未回复", value: "unreplied" },
  { label: "已处理", value: "processed" },
] as const;

export const ADMIN_FEEDBACK_STATUS_OPTIONS = [
  { label: "全部状态", value: "all" },
  { label: "received", value: "received" },
  { label: "reviewing", value: "reviewing" },
  { label: "needs_info", value: "needs_info" },
  { label: "accepted", value: "accepted" },
  { label: "deferred", value: "deferred" },
  { label: "published", value: "published" },
  { label: "hidden", value: "hidden" },
] as const;

export type AdminFeedbackTab = (typeof ADMIN_FEEDBACK_TABS)[number]["value"];
export type AdminFeedbackStatusFilter = (typeof ADMIN_FEEDBACK_STATUS_OPTIONS)[number]["value"];

export function parseAdminFeedbackListSearch(search: string) {
  const params = new URLSearchParams(search);
  const rawTab = params.get("tab");
  const rawStatus = params.get("status");
  const rawPage = Number(params.get("page"));

  const tab = ADMIN_FEEDBACK_TABS.some((item) => item.value === rawTab)
    ? (rawTab as AdminFeedbackTab)
    : DEFAULT_ADMIN_FEEDBACK_TAB;
  const status = ADMIN_FEEDBACK_STATUS_OPTIONS.some((item) => item.value === rawStatus)
    ? (rawStatus as AdminFeedbackStatusFilter)
    : DEFAULT_ADMIN_FEEDBACK_STATUS;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return { tab, status, page };
}

export function buildAdminFeedbackListSearch(params: {
  tab?: AdminFeedbackTab;
  status?: AdminFeedbackStatusFilter;
  page?: number;
}) {
  const search = new URLSearchParams();
  search.set("tab", params.tab ?? DEFAULT_ADMIN_FEEDBACK_TAB);
  search.set("status", params.status ?? DEFAULT_ADMIN_FEEDBACK_STATUS);
  search.set("page", String(params.page ?? 1));
  return `?${search.toString()}`;
}
