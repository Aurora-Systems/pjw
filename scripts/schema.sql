--
-- PocketJobs — baseline database schema (public schema).
-- Generated from the live Neon `pocket_jobs` DB (PG 17). This is the source of
-- truth for standing up a fresh environment.
--
-- Usage:
--   psql "$DATABASE_URL" -f scripts/schema.sql      # create all tables
--   psql "$DATABASE_URL" -f scripts/seed.sql        # seed service categories
--
-- Note: Neon Auth (neon_auth.*) lives in the separate neondb database and is
-- provisioned by Neon, not by this file.
--

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.10 (21f7c76)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bids (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    price numeric(10,2) NOT NULL,
    start_text text,
    message text,
    boosted boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bids_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    job_id uuid,
    service text NOT NULL,
    scheduled_at timestamp with time zone,
    address text,
    notes text,
    total numeric(10,2),
    payment_method text,
    status text DEFAULT 'confirmed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    paid_at timestamp with time zone,
    provider_lat double precision,
    provider_lng double precision,
    provider_location_at timestamp with time zone,
    lat double precision,
    lng double precision,
    CONSTRAINT bookings_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'pending'::text, 'paid'::text, 'refunded'::text]))),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'on_the_way'::text, 'arrived'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    sector text
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    job_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    booking_id uuid,
    raised_by uuid,
    reason text NOT NULL,
    amount numeric(10,2),
    category text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT disputes_status_check CHECK ((status = ANY (ARRAY['open'::text, 'resolved'::text])))
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    title text NOT NULL,
    category text,
    description text,
    budget_min numeric(10,2),
    budget_max numeric(10,2),
    when_text text,
    location text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    photos text[],
    workers_needed integer DEFAULT 1 NOT NULL,
    hired_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['open'::text, 'assigned'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT jobs_workers_needed_check CHECK (((workers_needed >= 1) AND (workers_needed <= 20))),
    CONSTRAINT jobs_hired_count_check CHECK (((hired_count >= 0) AND (hired_count <= workers_needed)))
);

-- A job stays 'open' until hired_count reaches workers_needed, so a multi-hire job keeps
-- taking bids while it is partially staffed; it flips to 'assigned' on the final hire.


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    body text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text DEFAULT 'account'::text NOT NULL,
    title text NOT NULL,
    body text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    user_id uuid NOT NULL,
    reference_number text,
    poll_url text,
    redirect_url text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    method text,
    status text DEFAULT 'pending'::text NOT NULL,
    raw_status text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kind text DEFAULT 'booking'::text NOT NULL,
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'cancelled'::text, 'review'::text])))
);


--
-- Name: provider_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_portfolio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_portfolio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    url text NOT NULL
);


--
-- Name: provider_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_profiles (
    user_id uuid NOT NULL,
    headline text,
    bio text,
    primary_category text,
    years_experience integer DEFAULT 0,
    hourly_rate numeric(10,2),
    visit_fee numeric(10,2) DEFAULT 0,
    min_hours integer DEFAULT 1,
    rating numeric(2,1) DEFAULT 0,
    jobs_count integer DEFAULT 0,
    on_time_pct integer DEFAULT 100,
    reviews_count integer DEFAULT 0,
    distance_km numeric(5,2),
    available boolean DEFAULT true NOT NULL,
    is_pro boolean DEFAULT false NOT NULL,
    is_top_rated boolean DEFAULT false NOT NULL,
    background_checked boolean DEFAULT false NOT NULL,
    license_verified boolean DEFAULT false NOT NULL,
    boost_until timestamp with time zone,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    lat double precision,
    lng double precision,
    onboarded boolean DEFAULT false NOT NULL,
    balance numeric DEFAULT 0 NOT NULL
);


--
-- Name: provider_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    rate numeric(10,2) NOT NULL,
    rate_type text DEFAULT 'hourly'::text NOT NULL,
    CONSTRAINT provider_services_rate_type_check CHECK ((rate_type = ANY (ARRAY['hourly'::text, 'fixed'::text, 'min'::text])))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    reviewer_id uuid NOT NULL,
    provider_id uuid,
    rating integer NOT NULL,
    comment text,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    photos text[],
    subject_id uuid,
    kind text DEFAULT 'provider'::text NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: saved_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text,
    address text NOT NULL,
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone text,
    email text,
    password_hash text,
    full_name text NOT NULL,
    role text DEFAULT 'customer'::text NOT NULL,
    avatar_url text,
    city text DEFAULT 'Harare'::text,
    id_verified boolean DEFAULT false NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    auth_id text,
    company_name text,
    company_reg_no text,
    verification_status text DEFAULT 'unverified'::text NOT NULL,
    account_type text,
    didit_session_id text,
    didit_decision jsonb,
    -- Didit's own status string ("Approved", "Declined", "Not Started", ...). This is the ONLY
    -- source for the public Verified badge (see DIDIT_VERIFIED_SQL in lib/didit.ts). Do not use
    -- id_verified for the badge: that is the permission-to-work gate and an admin can grant it.
    didit_status text,
    payout_number text,
    client_rating numeric,
    client_reviews_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT users_account_type_check CHECK ((account_type = ANY (ARRAY['individual'::text, 'company'::text]))),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['customer'::text, 'provider'::text, 'corporate'::text, 'admin'::text]))),
    CONSTRAINT users_verification_status_check CHECK ((verification_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric NOT NULL,
    balance_after numeric NOT NULL,
    booking_id uuid,
    reference text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: workforce_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workforce_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    corporate_id uuid NOT NULL,
    role_skill text NOT NULL,
    headcount integer DEFAULT 1 NOT NULL,
    hours_per_day integer DEFAULT 8 NOT NULL,
    start_date date,
    end_date date,
    site text,
    requirements text[],
    rate numeric(10,2),
    estimated_cost numeric(12,2),
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workforce_requests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'filling'::text, 'filled'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: bids bids_job_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_job_id_provider_id_key UNIQUE (job_id, provider_id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: conversations conversations_customer_id_provider_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_provider_id_job_id_key UNIQUE (customer_id, provider_id, job_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_reference_number_key UNIQUE (reference_number);


--
-- Name: provider_blocks provider_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_blocks
    ADD CONSTRAINT provider_blocks_pkey PRIMARY KEY (id);


--
-- Name: provider_portfolio provider_portfolio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_portfolio
    ADD CONSTRAINT provider_portfolio_pkey PRIMARY KEY (id);


--
-- Name: provider_profiles provider_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: provider_services provider_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: saved_addresses saved_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_addresses
    ADD CONSTRAINT saved_addresses_pkey PRIMARY KEY (id);


--
-- Name: users users_auth_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: workforce_requests workforce_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_pkey PRIMARY KEY (id);


--
-- Name: idx_addresses_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_user ON public.saved_addresses USING btree (user_id);


--
-- Name: idx_bids_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_job ON public.bids USING btree (job_id);


--
-- Name: idx_blocks_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocks_provider ON public.provider_blocks USING btree (provider_id, start_at);


--
-- Name: idx_bookings_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_customer ON public.bookings USING btree (customer_id);


--
-- Name: idx_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_payments_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_booking ON public.payments USING btree (booking_id);


--
-- Name: idx_payments_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_reference ON public.payments USING btree (reference_number);


--
-- Name: idx_portfolio_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_provider ON public.provider_portfolio USING btree (provider_id);


--
-- Name: idx_provider_profiles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_profiles_category ON public.provider_profiles USING btree (primary_category);


--
-- Name: idx_reviews_booking_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_reviews_booking_reviewer ON public.reviews USING btree (booking_id, reviewer_id) WHERE (booking_id IS NOT NULL);


--
-- Name: idx_reviews_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_subject ON public.reviews USING btree (subject_id, kind);


--
-- Name: idx_users_auth_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id);


--
-- Name: idx_users_didit_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_didit_status ON public.users USING btree (didit_status);


--
-- Name: idx_wallet_tx_booking_type; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_wallet_tx_booking_type ON public.wallet_transactions USING btree (booking_id, type) WHERE (booking_id IS NOT NULL);


--
-- Name: idx_wallet_tx_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_tx_provider ON public.wallet_transactions USING btree (provider_id, created_at DESC);


--
-- Name: idx_wallet_tx_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_wallet_tx_reference ON public.wallet_transactions USING btree (reference) WHERE (reference IS NOT NULL);


--
-- Name: idx_workforce_corporate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workforce_corporate ON public.workforce_requests USING btree (corporate_id);


--
-- Name: bids bids_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: bids bids_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: disputes disputes_raised_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_raised_by_fkey FOREIGN KEY (raised_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: provider_blocks provider_blocks_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_blocks
    ADD CONSTRAINT provider_blocks_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: provider_portfolio provider_portfolio_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_portfolio
    ADD CONSTRAINT provider_portfolio_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: provider_profiles provider_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: provider_services provider_services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: saved_addresses saved_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_addresses
    ADD CONSTRAINT saved_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workforce_requests workforce_requests_corporate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_corporate_id_fkey FOREIGN KEY (corporate_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


