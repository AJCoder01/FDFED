import { sessionReplaced, sessionRestored, store } from '../app/store.js';

export const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
let accessToken = null;
let refreshInFlight = null;
let sessionVersion = 0;
export const getAuthenticatedUser = () => store.getState().session.user;
let sessionQueue = Promise.resolve();

export function runSessionRequest(request) {
  // The cookie is shared across same-origin tabs. Serialize writes where Web Locks are available.
  const run = () => globalThis.navigator?.locks
    ? globalThis.navigator.locks.request('servicehub-session', request)
    : request();
  const result = sessionQueue.then(run);
  sessionQueue = result.catch(() => {});
  return result;
}

export function setSession(session) {
  sessionVersion++;
  accessToken = session?.accessToken || null;
  const user = session?.user || null;
  store.dispatch(sessionReplaced(user));
  return user;
}
export async function refreshSession() {
  if (!refreshInFlight) {
    const version = sessionVersion;
    refreshInFlight = runSessionRequest(async () => {
      if (version !== sessionVersion) return getAuthenticatedUser();
      const restore = () => fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        // Let a rotating-cookie response finish even when a page is reloaded
        // while session restoration is still in progress.
        keepalive: true,
      });
      let response = await restore();
      // A preceding page's kept-alive rotation may still be delivering its
      // HttpOnly cookie. Retry with the browser's latest cookie, without making
      // consumed tokens reusable on the server.
      for (const delay of [100, 250]) {
        if (response.status !== 401 || version !== sessionVersion) break;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (version !== sessionVersion) break;
        response = await restore();
      }
      if (version !== sessionVersion) return getAuthenticatedUser();
      if (!response.ok && response.status !== 401)
        throw new Error("Unable to restore your session.");
      const session = response.status === 401 || response.status === 204
        ? null
        : await response.json();
      if (version !== sessionVersion) return getAuthenticatedUser();
      accessToken = session?.accessToken || null;
      const user = session?.user || null;
      store.dispatch(sessionRestored(user));
      return user;
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
export async function api(
  path,
  { method = "GET", body, blob = false, retry = true } = {},
) {
  const headers = {};
  const cookieAuth = [
    "/auth/login",
    "/auth/signup",
    "/auth/refresh",
    "/auth/logout",
  ].includes(path);
  const sentToken = accessToken;
  const identity = store.getState().session.identity;
  if (accessToken && !cookieAuth)
    headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    if (store.getState().session.identity === identity && sentToken === accessToken)
      await refreshSession();
    if (accessToken && store.getState().session.identity === identity)
      return api(path, { method, body, blob, retry: false });
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message || `Request failed (${response.status}).`,
    );
  }
  return blob
    ? response.blob()
    : response.status === 204
      ? null
      : response.json();
}
export async function collection(path, params = {}) {
  const all = [];
  let page = 1;
  while (true) {
    const q = new URLSearchParams(
      Object.entries({ ...params, page, limit: 100 }).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );
    const result = await api(`${path}?${q}`);
    if (Array.isArray(result)) return result;
    all.push(...result.items);
    if (result.items.length === 0 || all.length >= result.total) return all;
    page++;
  }
}
export async function uploadFile(file, purpose = "evidence") {
  const body = new FormData();
  body.append("file", file, file.name || "upload");
  body.append("purpose", purpose);
  return api("/uploads", { method: "POST", body });
}
export async function uploadImage(value) {
  if (!value || value.startsWith("data:image/svg+xml")) return "";
  if (!value.startsWith("data:")) return value;
  const blob = await (await fetch(value)).blob();
  return (
    await uploadFile(
      new File([blob], `image.${blob.type.split("/")[1] || "png"}`, {
        type: blob.type,
      }),
      "image",
    )
  ).url;
}
export async function uploadEvidence(files = []) {
  return Promise.all(
    files.map(async (f) => {
      if (f.fileId) return f.fileId;
      const raw = f.file || f;
      if (raw instanceof File) return (await uploadFile(raw)).id;
      if (f.fileData) {
        const blob = await (await fetch(f.fileData)).blob();
        return (
          await uploadFile(
            new File([blob], f.filename || f.name || "evidence", {
              type: blob.type,
            }),
          )
        ).id;
      }
      throw new Error("Select the actual evidence file before submitting.");
    }),
  );
}
export async function downloadFile(id, filename, preview = false) {
  const blob = await api(`/uploads/${encodeURIComponent(id)}`, { blob: true });
  const url = URL.createObjectURL(blob);
  if (preview) {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
