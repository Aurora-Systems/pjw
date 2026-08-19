export type UserRole = "customer" | "provider" | "corporate" | "admin";
export type AccountType = "individual" | "company";

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string;
  role: UserRole;
  account_type?: AccountType | null;
  avatar_url: string | null;
  city: string | null;
  id_verified?: boolean;
  provider_onboarded?: boolean;
  /**
   * True when the account owns a provider_profiles row (and therefore a wallet balance).
   * That row survives switching to client mode, so the wallet stays reachable in both modes —
   * `role` alone can't tell you whether there is money to show.
   */
  has_wallet?: boolean;
  client_rating?: string | null;
  client_reviews_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  /** Sector heading used to group the picker (e.g. "Home & Property"). */
  sector: string | null;
}

export interface Provider {
  id: string;
  full_name: string;
  avatar_url: string | null;
  /** Permission-to-work gate (an admin can grant this). NOT the badge — see didit_verified. */
  id_verified: boolean;
  /** Completed Didit KYC and was approved. This is the ONLY thing that earns the Verified badge. */
  didit_verified?: boolean;
  city: string | null;
  headline: string | null;
  primary_category: string | null;
  years_experience: number;
  hourly_rate: string | null;
  rating: string | null;
  jobs_count: number;
  reviews_count: number;
  distance_km: string | null;
  is_pro: boolean;
  is_top_rated: boolean;
  lat?: number | null;
  lng?: number | null;
}

export interface ProviderService {
  id: string;
  category: string;
  title: string;
  rate: string;
  rate_type: "hourly" | "fixed" | "min";
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  photos?: string[] | null;
  created_at: string;
  reviewer_name: string;
}

export interface SavedAddress {
  id: string;
  label: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface ProviderBlock {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export interface ProviderDetail extends Provider {
  bio: string | null;
  visit_fee: string | null;
  min_hours: number;
  on_time_pct: number;
  background_checked: boolean;
  license_verified: boolean;
}

export interface Job {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  budget_min: string | null;
  budget_max: string | null;
  when_text: string | null;
  location: string | null;
  status: "open" | "assigned" | "completed" | "cancelled";
  created_at: string;
  bid_count?: number;
  photos?: string[] | null;
  /** How many people this job needs (1 = a normal single-hire job). */
  workers_needed?: number;
  /** How many have been hired so far. The job stays open until this reaches workers_needed. */
  hired_count?: number;
}

export interface Bid {
  id: string;
  price: string;
  start_text: string | null;
  message: string | null;
  boosted: boolean;
  status: "pending" | "accepted" | "declined";
  provider_id: string;
  provider_name: string;
  rating: string | null;
  reviews_count: number | null;
  is_pro: boolean | null;
}

export type BookingStatus =
  | "confirmed"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  job_id: string | null;
  service: string;
  scheduled_at: string | null;
  address: string | null;
  total: string | null;
  status: BookingStatus;
  payment_status?: "unpaid" | "pending" | "paid" | "refunded";
  created_at: string;
  counterparty_name?: string;
  lat?: number | null;
  lng?: number | null;
  provider_lat?: number | null;
  provider_lng?: number | null;
  provider_location_at?: string | null;
  // ── present on the booking-detail (shared job page) response ──
  paid_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  notes?: string | null;
  customer_name?: string;
  provider_name?: string;
  customer_avatar_url?: string | null;
  provider_avatar_url?: string | null;
  customer_phone?: string | null;
  provider_phone?: string | null;
  provider_rating?: string | null;
  provider_reviews_count?: number | null;
  provider_didit_verified?: boolean;
  job_title?: string | null;
  job_description?: string | null;
  job_category?: string | null;
  job_when_text?: string | null;
  job_budget_min?: string | null;
  job_budget_max?: string | null;
  job_photos?: string[] | null;
  workers_needed?: number | null;
  hired_count?: number | null;
}

/** One entry in a booking's status audit trail. */
export interface BookingEvent {
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  actor_name: string | null;
}

export interface ProviderDashboard {
  profile: { rating: string | null; jobs_count: number; available: boolean; is_pro: boolean } | null;
  active: number;
  bids_out: number;
  week_earnings: string;
  week_jobs: number;
}

export interface OpenJob {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  budget_min: string | null;
  budget_max: string | null;
  when_text: string | null;
  location: string | null;
  customer_name: string;
  customer_rating?: string | null;
  customer_reviews_count?: number;
  bid_count: number;
  has_my_bid: boolean;
  /** Multi-hire: how many people the job needs, and how many are already hired. */
  workers_needed?: number;
  hired_count?: number;
  /** True when this provider has already been hired on this (still-open) multi-hire job. */
  i_am_hired?: boolean;
}

export interface MyBid {
  id: string;
  price: string;
  start_text: string | null;
  status: "pending" | "accepted" | "declined";
  job_id: string;
  job_title: string;
  job_status: string;
}

export interface Earnings {
  available: string;
  all_time: string;
  this_month: string;
  month_jobs: number;
  recent: { id: string; service: string; total: string | null; created_at: string; customer_name: string }[];
}

export interface WalletTxn {
  id: string;
  type: "topup" | "commission" | "adjustment";
  amount: string;
  balance_after: string;
  description: string | null;
  created_at: string;
}

export interface Wallet {
  balance: number;
  can_take_work: boolean;
  commission_rate: number;
  packages: number[];
  transactions: WalletTxn[];
  completed_jobs: number;
  completed_value: string;
}

export interface CorporateProfile {
  id: string;
  full_name: string;
  email: string | null;
  company_name: string | null;
  company_reg_no: string | null;
  account_type: AccountType | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
}

export interface CorporateDashboard {
  active: number;
  this_month: number;
  month_spend: string;
  recent: WorkforceRequest[];
}

export interface WorkforceRequest {
  id: string;
  role_skill: string;
  headcount: number;
  hours_per_day: number;
  start_date: string | null;
  end_date: string | null;
  site: string | null;
  requirements: string[] | null;
  estimated_cost: string | null;
  status: string;
  created_at: string;
}

export interface SeriesPoint {
  date: string;
  count: number;
}

export interface AdminRecentUser {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AdminMetrics {
  /** Legacy keys — also read by the mobile app. */
  active_users: number;
  jobs_today: number;
  open_disputes: number;
  pending_verifications: number;

  // People
  total_users: number;
  new_users_today: number;
  new_users_7d: number;
  new_users_30d: number;
  customers: number;
  providers: number;
  corporates: number;
  admins: number;
  verified_providers: number;

  // Demand
  total_jobs: number;
  active_jobs: number;
  assigned_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  jobs_7d: number;

  // Fulfilment
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;

  // Money. Jobs are cash-only and settle off-platform; the platform's money-in is
  // provider wallet top-ups, consumed as 10% commission. There are NO payouts.
  cash_volume: number; // value of completed bookings, paid in cash between the parties
  topup_revenue: number; // money actually collected from providers
  commission_earned: number; // top-up credit consumed as commission (net of refunds)
  unspent_credit: number; // prepaid credit not yet consumed (non-refundable)
  pending_topups: number;

  // Liquidity
  total_bids: number;
  avg_bids_per_job: number;
  open_jobs_without_bids: number;

  // Marketplace health — does a posted job actually become work?
  fill_rate_pct: number; // share of jobs that reached a hire
  offer_rate_pct: number; // share of jobs that got at least one offer
  jobs_no_offers: number;
  median_mins_to_first_offer: number;
  median_mins_to_hire: number;

  /** Provider activation. Each stage is a subset of the one above it. */
  funnel: {
    signed_up: number;
    onboarded: number;
    permitted: number; // cleared to work
    funded: number; // holds wallet credit — required before making an offer
    made_offer: number;
    worked: number;
  };

  // The operational queue — things quietly rotting that need a human today.
  stale_jobs_no_offers: number; // open >48h with nothing on them
  completed_unpaid: number; // finished work the provider hasn't confirmed payment for
  bookings_in_flight: number;
  jobs_missing_category: number;
  oldest_open_dispute_hrs: number;

  /** Last 7 days against the 7 before, so direction is visible, not just totals. */
  growth: {
    signups: { now: number; prev: number };
    jobs: { now: number; prev: number };
    gmv: { now: number; prev: number };
  };
  repeat_customers: number;
  customers_who_posted: number;
  repeat_rate_pct: number;

  /** Per trade, ordered by unanswered demand — the top row is where to recruit. */
  supply_demand: {
    trade: string;
    jobs: number;
    unanswered: number;
    providers: number;
    can_take_work: number; // providers with credit; the rest cannot make an offer
  }[];

  // Quality
  total_reviews: number;
  avg_rating: number;

  // Series & breakdowns
  signups_series: SeriesPoint[];
  jobs_series: SeriesPoint[];
  top_categories: { category: string; count: number }[];
  recent_users: AdminRecentUser[];
}

export interface VerificationItem {
  id: string;
  full_name: string;
  email: string | null;
  primary_category: string | null;
}

export interface Dispute {
  id: string;
  reason: string;
  amount: string | null;
  category: string | null;
  status: "open" | "resolved";
  created_at: string;
}

export interface Conversation {
  id: string;
  job_id: string | null;
  created_at: string;
  counterparty_name: string;
  counterparty_avatar_url: string | null;
  counterparty_id: string;
  last_message: string | null;
  last_at: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  /** Public R2 URL of an attached image or document (null on plain text messages). */
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

/* ───────────────────────────────────────────
   Admin operations console (/admin)
   Shapes returned by the /api/admin/* routes. Kept separate from the public types on
   purpose: these payloads expose things the rest of the app must never see (the raw
   permission-to-work gate, ban state, wallet balances, the audit trail).
   ─────────────────────────────────────────── */

/** A row of GET /api/admin/users. */
export interface AdminUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  /**
   * Permission to work — an admin grants this and it gates bidding. It is NOT the public
   * Verified badge; only `didit_status = 'approved'` earns that. The admin payload shows
   * the raw gate (unlike /api/providers, which masks it behind the Didit truth).
   */
  id_verified: boolean;
  didit_status: string | null;
  /** A ban is a soft delete, so this is `deleted_at IS NOT NULL`. */
  banned: boolean;
  /** Providers only — everyone else has no wallet, hence null rather than 0. */
  balance: number | null;
  jobs_count: number;
  bookings_count: number;
}

/** The narrower row PATCH /api/admin/users/:id returns (no counts, no balance). */
export type AdminUserPatched = Pick<
  AdminUser,
  "id" | "full_name" | "email" | "phone" | "role" | "avatar_url" | "city" | "created_at" | "id_verified" | "didit_status" | "banned"
> & { verification_status: string };

export type AdminUserStatus = "all" | "active" | "banned" | "unverified";

/** A row of GET /api/admin/jobs. */
export interface AdminJob {
  id: string;
  title: string;
  category: string | null;
  status: "open" | "assigned" | "completed" | "cancelled";
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  location: string | null;
  /** A multi-hire job stays `open` while partially staffed — read these, not `status`. */
  workers_needed: number;
  hired_count: number;
  offers: number;
  customer_name: string;
  customer_id: string;
}

/** Ledger row of GET /api/admin/wallet/:userId (numbers, not the strings WalletTxn carries). */
export interface AdminWalletTxn {
  id: string;
  /** topup | commission | commission_refund | admin_credit | topup_reversal | … (no DB constraint). */
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface AdminWalletView {
  balance: number;
  transactions: AdminWalletTxn[];
}

export type AdminWalletAction = "credit" | "reverse_topup" | "refund_commission";

export type EnquiryStatus = "open" | "answered" | "closed";

/** A row of GET /api/admin/enquiries. */
export interface Enquiry {
  id: string;
  source: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  assigned_to: string | null;
  answered_at: string | null;
  created_at: string;
  reply_count: number;
}

/** GET /api/admin/enquiries/:id — the whole row plus the joined names. */
export type EnquiryDetail = Omit<Enquiry, "reply_count"> & {
  updated_at?: string | null;
  /** The linked account's current name; the enquiry itself stores the name as typed. */
  user_name?: string | null;
  assigned_to_name?: string | null;
};

export interface EnquiryReply {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  body: string;
  /** Null means the answer is stored but was never delivered — surface this, don't hide it. */
  emailed_at: string | null;
  created_at: string;
}

export interface EnquiryCounts {
  open: number;
  answered: number;
  closed: number;
}

/** A row of GET /api/admin/audit — every state-changing admin action. */
export interface AdminAction {
  id: string;
  /** Null when the admin who did it has since been removed (the row deliberately survives). */
  admin_id: string | null;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}
