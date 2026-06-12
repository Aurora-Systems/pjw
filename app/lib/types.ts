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
  created_at: string;
  reviewer_name: string;
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

export interface AdminMetrics {
  active_users: number;
  jobs_today: number;
  open_disputes: number;
  pending_verifications: number;
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
