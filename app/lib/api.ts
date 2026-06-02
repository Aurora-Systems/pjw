"use client";

import type {
  AccountType,
  AdminMetrics,
  Bid,
  Booking,
  BookingStatus,
  Category,
  CorporateDashboard,
  CorporateProfile,
  Dispute,
  Earnings,
  Job,
  MyBid,
  OpenJob,
  Provider,
  ProviderDashboard,
  ProviderDetail,
  ProviderService,
  Review,
  User,
  UserRole,
  VerificationItem,
  WorkforceRequest,
} from "./types";

const TOKEN_KEY = "pj_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  return data as T;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const api = {
  requestOtp: (email: string) =>
    request<{ ok: boolean }>("/auth/otp/request", { method: "POST", body: { email } }),
  verifyOtp: (body: { email: string; otp: string; role?: UserRole; full_name?: string; account_type?: AccountType }) =>
    request<AuthResponse>("/auth/otp/verify", { method: "POST", body }),
  devLogin: (body: { email: string; role?: UserRole; full_name?: string; account_type?: AccountType }) =>
    request<AuthResponse>("/auth/dev-login", { method: "POST", body }),
  me: () => request<{ user: User }>("/auth/me", { auth: true }),

  categories: () => request<{ categories: Category[] }>("/categories"),
  providers: (params: { category?: string; q?: string; verified?: boolean; maxRate?: number; sort?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.q) qs.set("q", params.q);
    if (params.verified) qs.set("verified", "true");
    if (params.maxRate != null) qs.set("maxRate", String(params.maxRate));
    if (params.sort) qs.set("sort", params.sort);
    const s = qs.toString();
    return request<{ providers: Provider[] }>(`/providers${s ? `?${s}` : ""}`);
  },
  provider: (id: string) =>
    request<{ provider: ProviderDetail; services: ProviderService[]; reviews: Review[] }>(`/providers/${id}`),

  myJobs: () => request<{ jobs: Job[] }>("/jobs", { auth: true }),
  postJob: (body: Record<string, unknown>) => request<{ job: Job }>("/jobs", { method: "POST", body, auth: true }),
  job: (id: string) => request<{ job: Job; bids: Bid[] }>(`/jobs/${id}`),
  submitBid: (jobId: string, body: Record<string, unknown>) =>
    request<{ bid: Bid }>(`/jobs/${jobId}/bids`, { method: "POST", body, auth: true }),
  acceptBid: (bidId: string) => request<{ booking: Booking }>(`/bids/${bidId}/accept`, { method: "POST", auth: true }),

  bookings: () => request<{ bookings: Booking[] }>("/bookings", { auth: true }),
  createBooking: (body: Record<string, unknown>) =>
    request<{ booking: Booking }>("/bookings", { method: "POST", body, auth: true }),
  updateBooking: (id: string, status: BookingStatus) =>
    request<{ booking: Booking }>(`/bookings/${id}`, { method: "PATCH", body: { status }, auth: true }),

  postReview: (body: Record<string, unknown>) => request<{ review: Review }>("/reviews", { method: "POST", body, auth: true }),

  providerDashboard: () => request<ProviderDashboard>("/provider/dashboard", { auth: true }),
  providerOpenJobs: (category?: string) =>
    request<{ jobs: OpenJob[] }>(`/provider/jobs${category ? `?category=${category}` : ""}`, { auth: true }),
  providerBids: () => request<{ bids: MyBid[] }>("/provider/bids", { auth: true }),
  providerEarnings: () => request<Earnings>("/provider/earnings", { auth: true }),
  boost: (plan: string) => request<{ ok: boolean }>("/provider/boost", { method: "POST", body: { plan }, auth: true }),

  corporateProfile: () => request<{ profile: CorporateProfile }>("/corporate/profile", { auth: true }),
  updateCorporateProfile: (body: Record<string, unknown>) =>
    request<{ profile: CorporateProfile }>("/corporate/profile", { method: "PATCH", body, auth: true }),
  corporateDashboard: () => request<CorporateDashboard>("/corporate/dashboard", { auth: true }),
  workforceRequests: () => request<{ requests: WorkforceRequest[] }>("/workforce", { auth: true }),
  createWorkforceRequest: (body: Record<string, unknown>) =>
    request<{ request: WorkforceRequest }>("/workforce", { method: "POST", body, auth: true }),

  adminMetrics: () => request<AdminMetrics>("/admin/metrics", { auth: true }),
  adminVerifications: () => request<{ queue: VerificationItem[] }>("/admin/verifications", { auth: true }),
  reviewVerification: (user_id: string, action: "approve" | "reject") =>
    request<{ ok: boolean }>("/admin/verifications", { method: "PATCH", body: { user_id, action }, auth: true }),
  adminDisputes: () => request<{ disputes: Dispute[] }>("/admin/disputes", { auth: true }),
  resolveDispute: (id: string) =>
    request<{ dispute: Dispute }>("/admin/disputes", { method: "PATCH", body: { id, status: "resolved" }, auth: true }),
};
