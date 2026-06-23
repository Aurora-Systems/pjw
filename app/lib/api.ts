"use client";

import type {
  AccountType,
  AdminMetrics,
  Bid,
  Booking,
  BookingStatus,
  Category,
  Conversation,
  CorporateDashboard,
  CorporateProfile,
  Dispute,
  Message,
  Earnings,
  Wallet,
  Job,
  MyBid,
  OpenJob,
  Provider,
  ProviderDashboard,
  ProviderDetail,
  ProviderService,
  Review,
  SavedAddress,
  ProviderBlock,
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
  verifyOtp: (body: { email: string; otp: string; role?: UserRole; full_name?: string; account_type?: AccountType; signup?: boolean }) =>
    request<AuthResponse>("/auth/otp/verify", { method: "POST", body }),
  devLogin: (body: { email: string; role?: UserRole; full_name?: string; account_type?: AccountType }) =>
    request<AuthResponse>("/auth/dev-login", { method: "POST", body }),
  me: () => request<{ user: User }>("/auth/me", { auth: true }),
  becomeProvider: () => request<AuthResponse>("/account/become-provider", { method: "POST", auth: true }),
  becomeCustomer: () => request<AuthResponse>("/account/become-customer", { method: "POST", auth: true }),

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
    request<{ provider: ProviderDetail; services: ProviderService[]; reviews: Review[]; portfolio: string[] }>(
      `/providers/${id}`
    ),

  myJobs: () => request<{ jobs: Job[] }>("/jobs", { auth: true }),
  postJob: (body: Record<string, unknown>) => request<{ job: Job }>("/jobs", { method: "POST", body, auth: true }),
  job: (id: string) => request<{ job: Job; bids: Bid[] }>(`/jobs/${id}`),
  submitBid: (jobId: string, body: Record<string, unknown>) =>
    request<{ bid: Bid }>(`/jobs/${jobId}/bids`, { method: "POST", body, auth: true }),
  acceptBid: (bidId: string) => request<{ booking: Booking }>(`/bids/${bidId}/accept`, { method: "POST", auth: true }),

  bookings: () => request<{ bookings: Booking[] }>("/bookings", { auth: true }),
  booking: (id: string) => request<{ booking: Booking }>(`/bookings/${id}`, { auth: true }),

  // uploads / account / portfolio / verification
  // Mint a presigned URL for a direct-to-R2 upload; client PUTs bytes then stores `url`.
  signUpload: (body: { kind?: string; mime: string; size: number }) =>
    request<{ key: string; uploadUrl: string; url: string }>("/uploads", { method: "POST", body, auth: true }),
  updateAccount: (body: { full_name?: string; avatar_url?: string; city?: string; payout_number?: string }) =>
    request<{ user: User }>("/account", { method: "PATCH", body, auth: true }),
  deleteAccount: () => request<{ ok: boolean }>("/account", { method: "DELETE", auth: true }),

  // saved addresses
  addresses: () => request<{ addresses: SavedAddress[] }>("/addresses", { auth: true }),
  addAddress: (body: { label?: string; address: string; lat?: number; lng?: number }) =>
    request<{ address: SavedAddress }>("/addresses", { method: "POST", body, auth: true }),
  deleteAddress: (id: string) =>
    request<{ ok: boolean }>(`/addresses/${id}`, { method: "DELETE", auth: true }),

  // provider availability blocks
  providerBlocks: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const s = qs.toString();
    return request<{ blocks: ProviderBlock[] }>(`/provider/blocks${s ? `?${s}` : ""}`, { auth: true });
  },
  addBlock: (body: { start_at: string; end_at: string; reason?: string }) =>
    request<{ block: ProviderBlock }>("/provider/blocks", { method: "POST", body, auth: true }),
  deleteBlock: (id: string) =>
    request<{ ok: boolean }>(`/provider/blocks/${id}`, { method: "DELETE", auth: true }),

  // public testimonials (marketing)
  testimonials: () =>
    request<{ testimonials: { comment: string; reviewer_first_name: string; provider_name: string; primary_category: string | null }[] }>(
      "/testimonials"
    ),
  portfolio: () =>
    request<{ portfolio: { id: string; url: string }[] }>("/provider/portfolio", { auth: true }),
  addPortfolio: (url: string) =>
    request<{ item: { id: string; url: string } }>("/provider/portfolio", { method: "POST", body: { url }, auth: true }),
  deletePortfolio: (id: string) =>
    request<{ ok: boolean }>(`/provider/portfolio/${id}`, { method: "DELETE", auth: true }),
  startVerification: () =>
    request<{ url: string; session_id: string }>("/verification/start", { method: "POST", auth: true }),
  verificationStatus: () =>
    request<{ verification_status: string; id_verified: boolean }>("/verification/status", { auth: true }),

  // payments (Pesepay)
  initiatePayment: (booking_id: string) =>
    request<{ redirectUrl: string; referenceNumber: string }>("/payments/initiate", {
      method: "POST",
      body: { booking_id },
      auth: true,
    }),
  paymentStatus: (reference: string) =>
    request<{ status: string; paid: boolean }>(`/payments/status?reference=${encodeURIComponent(reference)}`, {
      auth: true,
    }),
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
  // Provider prepaid wallet (balance + top-ups + commission ledger).
  wallet: () => request<Wallet>("/provider/wallet", { auth: true }),
  topup: (amount: number) =>
    request<{ redirectUrl: string; referenceNumber: string }>("/provider/topup", {
      method: "POST",
      body: { amount },
      auth: true,
    }),
  boost: (plan: string) => request<{ ok: boolean }>("/provider/boost", { method: "POST", body: { plan }, auth: true }),

  providerProfile: () =>
    request<{ profile: Record<string, unknown>; services: ProviderService[] }>("/provider/profile", { auth: true }),
  updateProviderProfile: (body: Record<string, unknown>) =>
    request<{ profile: Record<string, unknown> }>("/provider/profile", { method: "PATCH", body, auth: true }),
  providerServices: () =>
    request<{ services: ProviderService[] }>("/provider/services", { auth: true }),
  addService: (body: { category?: string; title: string; rate: number; rate_type?: string }) =>
    request<{ service: ProviderService }>("/provider/services", { method: "POST", body, auth: true }),
  deleteService: (id: string) =>
    request<{ ok: boolean }>(`/provider/services/${id}`, { method: "DELETE", auth: true }),

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

  conversations: () => request<{ conversations: Conversation[] }>("/conversations", { auth: true }),
  startConversation: (counterparty_id: string, job_id?: string) =>
    request<{ conversation: Conversation }>("/conversations", { method: "POST", body: { counterparty_id, job_id }, auth: true }),
  messages: (conversationId: string, after?: string) =>
    request<{ messages: Message[] }>(
      `/conversations/${conversationId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`,
      { auth: true }
    ),
  sendMessage: (conversationId: string, body: string) =>
    request<{ message: Message }>(`/conversations/${conversationId}/messages`, { method: "POST", body: { body }, auth: true }),
};
