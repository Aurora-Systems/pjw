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
  client_rating?: string | null;
  client_reviews_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface Provider {
  id: string;
  full_name: string;
  avatar_url: string | null;
  id_verified: boolean;
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
}
