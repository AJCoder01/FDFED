import {
  api,
  collection,
  setSession,
  authenticatedUser,
  uploadImage,
  uploadEvidence,
} from "./apiClient";
import { DATA_CHANGED } from "./repositoryEvents";
const pick = (v, keys) =>
  Object.fromEntries(
    keys.filter((k) => v[k] !== undefined).map((k) => [k, v[k]]),
  );
async function mutate(path, body, method = "POST") {
  const result = await api(path, { method, body });
  window.dispatchEvent(new Event(DATA_CHANGED));
  return result;
}
export async function authenticateUser(email, password, role) {
  return setSession(
    await api("/auth/login", {
      method: "POST",
      body: { email, password, role },
    }),
  );
}
export async function signUpUser(data) {
  return setSession(
    await api("/auth/signup", {
      method: "POST",
      body: pick(data, [
        "email",
        "password",
        "role",
        "name",
        "phone",
        "businessName",
        "serviceArea",
        "skills",
        "addressLine",
        "city",
        "pincode",
        "addressLabel",
      ]),
    }),
  );
}
export async function logoutUser() {
  await api("/auth/logout", { method: "POST" });
  setSession(null);
}
export async function switchDemoRole(role) {
  return setSession(
    await api("/auth/demo-switch", { method: "POST", body: { role } }),
  );
}
export const getUserProfile = () => api("/users/me");
export const getCustomerById = () => getUserProfile();
export async function updateUserProfile(id, values) {
  const data = pick(values, [
    "name",
    "phone",
    "email",
    "avatar",
    "location",
    "country",
    "title",
    "department",
  ]);
  if (data.avatar !== undefined) data.avatar = await uploadImage(data.avatar);
  if (values.addresses) await saveCustomerAddresses(id, values.addresses);
  return mutate("/users/me", data, "PATCH");
}
export const saveCustomerAddresses = (id, addresses) =>
  mutate(
    "/customers/me/addresses",
    {
      addresses: addresses.map((a) =>
        pick(a, ["id", "label", "addressLine", "city", "pincode", "isDefault"]),
      ),
    },
    "PUT",
  );
export const getProviders = () => collection("/providers");
export const getProviderById = (id) =>
  api(`/providers/${encodeURIComponent(id)}`);
export async function saveProvider(id, values, submit = false) {
  const data = pick(values, [
    "name",
    "phone",
    "avatar",
    "businessName",
    "serviceArea",
    "skills",
    "documentName",
  ]);
  if (data.avatar !== undefined) data.avatar = await uploadImage(data.avatar);
  return mutate("/providers/me", { ...data, submit }, "PUT");
}
export const saveAvailability = (id, schedule) =>
  mutate(
    "/providers/me/availability",
    pick(schedule, [
      "days",
      "startTime",
      "endTime",
      "blackoutDates",
      "leadMinutes",
      "bufferMinutes",
      "timeZone",
    ]),
    "PUT",
  );
export const moderateProvider = (id, status, reason) =>
  mutate(`/providers/${id}/moderation`, { status, reason });
export const getCategories = () => api("/categories");
export const getServices = (filters = {}) =>
  collection("/services", {
    ...pick(filters, ["category", "search", "maxPrice", "sort"]),
    ...(["provider", "admin"].includes(filters.role)
      ? { scope: "manage" }
      : {}),
  });
export const getServiceById = (id) => api(`/services/${id}`);
export async function saveService(values) {
  const data = pick(values, [
    "title",
    "description",
    "categoryId",
    "price",
    "duration",
    "image",
    "inclusions",
    "exclusions",
    "policy",
    "availableSlots",
    "status",
  ]);
  if (data.image !== undefined) data.image = await uploadImage(data.image);
  const service = await mutate(
    `/services${values.id ? `/${values.id}` : ""}`,
    data,
    values.id ? "PATCH" : "POST",
  );
  return { success: true, service };
}
export const deleteService = (id) =>
  mutate(`/services/${id}`, undefined, "DELETE");
export const getAvailableSlots = (id, date, excludeId) =>
  api(
    `/services/${id}/available-slots?${new URLSearchParams({ date, ...(excludeId ? { excludeId } : {}) })}`,
  );
export const getBookings = () => collection("/bookings");
export const getBookingById = (id) => api(`/bookings/${id}`);
export const createBooking = (values) =>
  mutate(
    "/bookings",
    pick(values, [
      "serviceId",
      "scheduledDate",
      "scheduledSlot",
      "address",
      "paymentMethod",
      "amount",
      "notes",
      "requestKey",
    ]),
  );
export function updateBookingStatus(id, status, note = "") {
  const action =
    status === "cancelled"
      ? authenticatedUser?.role === "provider"
        ? "decline"
        : "cancel"
      : { active: "accept", in_progress: "start", completed: "complete" }[
          status
        ];
  if (!action) throw new Error("Unsupported booking action.");
  return mutate(`/bookings/${id}/${action}`, { note });
}
export const proposeBookingTime = (id, date, slot) =>
  mutate(`/bookings/${id}/time-proposals`, { date, slot });
export const respondToTimeProposal = (id, accept) =>
  mutate(`/bookings/${id}/time-proposal-response`, { accept });
export const submitReview = (id, rating, comment) =>
  mutate(`/bookings/${id}/review`, { rating, comment });
export const replyToReview = (id, reply) =>
  mutate(`/bookings/${id}/review-reply`, { reply });
export const getServiceReviews = (id) => api(`/services/${id}/reviews`);
export const getRevenueStats = () => api("/admin/revenue");
export const getTickets = () => collection("/tickets");
export const createTicket = (values) =>
  mutate(
    "/tickets",
    pick(values, ["bookingId", "issueType", "severity", "description"]),
  );
export const resolveTicket = (id, outcome) =>
  mutate(`/tickets/${id}/resolve`, { outcome });
export const getDisputes = () => collection("/disputes");
export const getDisputeById = (id) => api(`/disputes/${id}`);
export async function createDispute(values) {
  return mutate("/disputes", {
    ...pick(values, ["bookingId", "claimAmount", "customerStatement"]),
    fileIds: await uploadEvidence(values.evidences || []),
  });
}
export const assignDispute = (id, arbitrator) =>
  mutate(`/disputes/${id}/assignment`, { arbitratorId: arbitrator.id });
export async function saveDisputeResponse(
  id,
  providerId,
  statement,
  files = [],
) {
  return mutate(`/disputes/${id}/response`, {
    statement,
    fileIds: await uploadEvidence(files),
  });
}
export const scheduleHearing = (id, values) =>
  mutate(
    `/disputes/${id}/hearing`,
    pick(values, ["scheduledDate", "scheduledTime", "meetUrl"]),
  );
export const issueRuling = (id, values) =>
  mutate(
    `/disputes/${id}/ruling`,
    pick(values, ["verdict", "awardAmount", "reason"]),
  );
export const getNotifications = () => collection("/notifications");
export async function markNotificationsRead(userId, notificationId) {
  await mutate("/notifications/read", { notificationId });
  return getNotifications();
}
export const getAccounts = () => collection("/admin/accounts");
export const getActivityLogs = (userId) =>
  collection("/admin/activity", { userId });
export const getArbitratorApplications = () =>
  collection("/arbitrator-applications");
export async function submitArbitratorApplication(values) {
  const form = new FormData();
  for (const [key, value] of Object.entries(
    pick(values, [
      "name",
      "email",
      "password",
      "phone",
      "country",
      "linkedin",
      "title",
      "experience",
      "expertise",
      "organization",
      "prevExperience",
    ]),
  ))
    form.append(key, String(value));
  for (const [key, value] of Object.entries(values.files || {})) {
    const file = value?.file || value;
    if (file instanceof File) form.append(key, file);
  }
  return mutate("/arbitrator-applications", form);
}
export const approveArbitratorApplication = (id) =>
  mutate(`/arbitrator-applications/${id}/approve`, {});
export const rejectArbitratorApplication = (id, reason) =>
  mutate(`/arbitrator-applications/${id}/reject`, {
    reason: reason || "Requirements not met at this time.",
  });
export const resetDemoData = () => mutate("/admin/demo-reset", {});
export const createCustomJobRequest = (values) =>
  mutate("/custom-job-requests", {
    ...values,
    budget: values.budget === "" ? undefined : Number(values.budget),
  });
export const getCustomJobRequests = () => collection("/custom-job-requests");
