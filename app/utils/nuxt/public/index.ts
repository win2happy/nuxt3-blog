import axios from "axios";
import { isPrerender } from "~/utils/nuxt/constants";

export function DBOperate<T = any> (
  { apiPath, query, callback }:
  { apiPath: string, query: any, callback: (_: T) => any}
) {
  if (import.meta.client && !isPrerender && __NB_DATABASE_ENABLED__) {
    const cb = (data: T) => {
      try {
        callback(data);
      } catch { }
    };

    axios.post(`/api${apiPath}`, query).then(res => cb(res.data));
  }
}

const VISIT_DEBOUNCE_KEY = "nb_visit_debounce";
const VISIT_DEBOUNCE_MS = 5 * 60 * 1000;

function shouldLogVisit(nid: number, ntype: string): boolean {
  try {
    const stored = localStorage.getItem(VISIT_DEBOUNCE_KEY);
    if (stored) {
      const visits: Record<string, number> = JSON.parse(stored);
      const key = `${ntype}:${nid}`;
      const lastVisit = visits[key];
      if (lastVisit && Date.now() - lastVisit < VISIT_DEBOUNCE_MS) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

function recordVisit(nid: number, ntype: string) {
  try {
    const stored = localStorage.getItem(VISIT_DEBOUNCE_KEY);
    const visits: Record<string, number> = stored ? JSON.parse(stored) : {};
    const key = `${ntype}:${nid}`;
    visits[key] = Date.now();
    localStorage.setItem(VISIT_DEBOUNCE_KEY, JSON.stringify(visits));
  } catch {
    // ignore
  }
}

export function logVisit(nid: number, ntype: string) {
  if (import.meta.client && !isPrerender) {
    if (!shouldLogVisit(nid, ntype)) {
      return;
    }
    recordVisit(nid, ntype);
    axios.post("/api/db/log-visit", { nid, ntype }).catch(() => {});
  }
}
