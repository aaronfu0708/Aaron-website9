// lib/api.ts
import axios from "axios";

// --- 第一個後端 ---
const ORIGIN1 = process.env.NEXT_PUBLIC_API_ORIGIN || "https://aaron-website.onrender.com";
export const ROOT_BASE1 = ORIGIN1;

export const rootApi1 = axios.create({
  baseURL: ROOT_BASE1,
  withCredentials: true,
});

export const apiFetch1 = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("/") ? `${ROOT_BASE1}${endpoint}` : `${ROOT_BASE1}/${endpoint}`;
  const res = await fetch(url, { ...options, credentials: "include" });
  if (!res.ok) throw new Error(`API1 Error: ${res.status}`);
  return res.json();
};

// --- 第二個後端 ---
const ORIGIN2 = process.env.NEXT_PUBLIC_API_ORIGIN_2 || "https://aaron-website9.onrender.com";
export const ROOT_BASE2 = ORIGIN2;

export const rootApi2 = axios.create({
  baseURL: ROOT_BASE2,
  withCredentials: true,
});

export const apiFetch2 = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("/") ? `${ROOT_BASE2}${endpoint}` : `${ROOT_BASE2}/${endpoint}`;
  const res = await fetch(url, { ...options, credentials: "include" });
  if (!res.ok) throw new Error(`API2 Error: ${res.status}`);
  return res.json();
};

// --- 可選：允許 template string / toString 使用 BASE URL ---
try {
  [apiFetch1, rootApi1].forEach(fn => {
    (fn as any)[Symbol.toPrimitive] = () => ROOT_BASE1;
    (fn as any).toString = () => ROOT_BASE1;
    (fn as any).valueOf = () => ROOT_BASE1;
  });
  [apiFetch2, rootApi2].forEach(fn => {
    (fn as any)[Symbol.toPrimitive] = () => ROOT_BASE2;
    (fn as any).toString = () => ROOT_BASE2;
    (fn as any).valueOf = () => ROOT_BASE2;
  });
} catch (e) {
  // noop
}
