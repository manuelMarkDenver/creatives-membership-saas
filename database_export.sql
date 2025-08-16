--
-- PostgreSQL database dump
--

\restrict 1yGAJXSLq7zyjWWCmvbsrPCgg8T6g20eU37Tn8Ff1KYzsavM0WNtDg4YxLlYk4N

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccessLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AccessLevel" AS ENUM (
    'FULL_ACCESS',
    'MANAGER_ACCESS',
    'STAFF_ACCESS',
    'READ_ONLY'
);


ALTER TYPE public."AccessLevel" OWNER TO postgres;

--
-- Name: BillingCycle; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BillingCycle" AS ENUM (
    'TRIAL',
    'MONTHLY',
    'YEARLY',
    'ONE_TIME'
);


ALTER TYPE public."BillingCycle" OWNER TO postgres;

--
-- Name: BusinessCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BusinessCategory" AS ENUM (
    'GYM',
    'COFFEE_SHOP',
    'ECOMMERCE',
    'OTHER'
);


ALTER TYPE public."BusinessCategory" OWNER TO postgres;

--
-- Name: BusinessUnitType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BusinessUnitType" AS ENUM (
    'LOCATION',
    'CHANNEL',
    'DEPARTMENT',
    'FRANCHISE'
);


ALTER TYPE public."BusinessUnitType" OWNER TO postgres;

--
-- Name: GymMemberSubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GymMemberSubscriptionStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'CANCELLED',
    'EXPIRED',
    'PENDING_ACTIVATION'
);


ALTER TYPE public."GymMemberSubscriptionStatus" OWNER TO postgres;

--
-- Name: MemberAuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MemberAuditAction" AS ENUM (
    'ACCOUNT_CREATED',
    'ACCOUNT_ACTIVATED',
    'ACCOUNT_DEACTIVATED',
    'ACCOUNT_DELETED',
    'ACCOUNT_RESTORED',
    'SUBSCRIPTION_STARTED',
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_CANCELLED',
    'SUBSCRIPTION_EXPIRED',
    'SUBSCRIPTION_SUSPENDED',
    'SUBSCRIPTION_RESUMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
    'PROFILE_UPDATED',
    'PROFILE_PHOTO_UPDATED',
    'FACILITY_ACCESS_GRANTED',
    'FACILITY_ACCESS_REVOKED',
    'LOGIN_SUCCESSFUL',
    'LOGIN_FAILED'
);


ALTER TYPE public."MemberAuditAction" OWNER TO postgres;

--
-- Name: MembershipType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MembershipType" AS ENUM (
    'DAY_PASS',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMI_ANNUAL',
    'ANNUAL',
    'UNLIMITED',
    'STUDENT',
    'SENIOR',
    'CORPORATE'
);


ALTER TYPE public."MembershipType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'SUCCESSFUL',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PlanType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PlanType" AS ENUM (
    'TRIAL',
    'PAID'
);


ALTER TYPE public."PlanType" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'SUPER_ADMIN',
    'OWNER',
    'MANAGER',
    'STAFF',
    'GYM_TRAINER',
    'GYM_NUTRITIONIST',
    'GYM_FRONT_DESK',
    'GYM_MAINTENANCE',
    'GYM_MEMBER',
    'STORE_MANAGER',
    'PRODUCT_MANAGER',
    'INVENTORY_MANAGER',
    'CUSTOMER_SERVICE',
    'MARKETING_MANAGER',
    'FULFILLMENT_STAFF',
    'VENDOR',
    'ECOM_CUSTOMER',
    'COFFEE_MANAGER',
    'BARISTA',
    'CASHIER',
    'BAKER',
    'SHIFT_SUPERVISOR',
    'COFFEE_CUSTOMER'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: SaasSubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SaasSubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'SUSPENDED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."SaasSubscriptionStatus" OWNER TO postgres;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PAST_DUE',
    'CANCELED',
    'EXPIRED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."TransactionStatus" OWNER TO postgres;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'PAYMENT',
    'REFUND',
    'ADJUSTMENT',
    'REVERSAL',
    'CHARGEBACK'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    address text,
    "phoneNumber" text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "branchData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Branch" OWNER TO postgres;

--
-- Name: BusinessUnit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BusinessUnit" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "unitType" public."BusinessUnitType" DEFAULT 'LOCATION'::public."BusinessUnitType" NOT NULL,
    address text,
    "phoneNumber" text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isPaid" boolean DEFAULT false NOT NULL,
    "trialEndsAt" timestamp(3) without time zone,
    "subscriptionTier" text DEFAULT 'basic'::text,
    "monthlyPrice" numeric(8,2) DEFAULT 3999,
    "businessUnitData" jsonb,
    settings jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BusinessUnit" OWNER TO postgres;

--
-- Name: CustomerTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CustomerTransaction" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "customerId" text NOT NULL,
    "businessType" text DEFAULT 'gym'::text NOT NULL,
    "transactionCategory" text DEFAULT 'membership'::text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'PHP'::text,
    "taxAmount" numeric(12,2) DEFAULT 0,
    "discountAmount" numeric(12,2) DEFAULT 0,
    "netAmount" numeric(12,2) NOT NULL,
    "paymentMethod" text DEFAULT 'cash'::text,
    "paymentReference" text,
    "gatewayTransactionId" text,
    "transactionType" public."TransactionType" DEFAULT 'PAYMENT'::public."TransactionType" NOT NULL,
    status public."TransactionStatus" DEFAULT 'COMPLETED'::public."TransactionStatus" NOT NULL,
    "relatedEntityType" text,
    "relatedEntityId" text,
    "relatedEntityName" text,
    description text,
    notes text,
    metadata jsonb,
    "processedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomerTransaction" OWNER TO postgres;

--
-- Name: GymMemberSubscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GymMemberSubscription" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "branchId" text,
    "memberId" text NOT NULL,
    "membershipPlanId" text NOT NULL,
    status public."GymMemberSubscriptionStatus" DEFAULT 'ACTIVE'::public."GymMemberSubscriptionStatus" NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    price numeric(12,2) NOT NULL,
    currency text DEFAULT 'PHP'::text,
    "usageData" jsonb,
    "cancelledAt" timestamp(3) without time zone,
    "cancellationReason" text,
    "cancellationNotes" text,
    "autoRenew" boolean DEFAULT true,
    "nextBillingDate" date,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GymMemberSubscription" OWNER TO postgres;

--
-- Name: MemberAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MemberAuditLog" (
    id text NOT NULL,
    "memberId" text NOT NULL,
    action public."MemberAuditAction" NOT NULL,
    reason text,
    notes text,
    "previousState" text,
    "newState" text,
    "performedBy" text,
    "performedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MemberAuditLog" OWNER TO postgres;

--
-- Name: MembershipPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipPlan" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(65,30) NOT NULL,
    duration integer NOT NULL,
    type public."MembershipType" NOT NULL,
    benefits jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MembershipPlan" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "subscriptionId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentMethod" text,
    "transactionId" text,
    "receiptUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: Plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Plan" (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(65,30) NOT NULL,
    "billingCycle" public."BillingCycle" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Plan" OWNER TO postgres;

--
-- Name: PlatformRevenue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformRevenue" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "tenantName" text NOT NULL,
    "businessType" text NOT NULL,
    "revenueType" text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'PHP'::text,
    "billingPeriodStart" date,
    "billingPeriodEnd" date,
    "paymentStatus" text DEFAULT 'pending'::text,
    "paymentDate" timestamp(3) without time zone,
    "paymentMethod" text,
    "paymentReference" text,
    "sourceTransactionId" text,
    "subscriptionPlanId" text,
    description text,
    notes text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformRevenue" OWNER TO postgres;

--
-- Name: SaasSubscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SaasSubscription" (
    id text NOT NULL,
    "businessUnitId" text NOT NULL,
    "planName" text DEFAULT 'basic'::text NOT NULL,
    status public."SaasSubscriptionStatus" DEFAULT 'TRIAL'::public."SaasSubscriptionStatus" NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date,
    "trialEndsAt" date,
    "monthlyPrice" numeric(8,2) DEFAULT 3999 NOT NULL,
    currency text DEFAULT 'PHP'::text NOT NULL,
    "paymentMethod" text,
    "paymentReference" text,
    "lastPaymentDate" timestamp(3) without time zone,
    "nextBillingDate" date,
    "autoRenew" boolean DEFAULT true NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancellationReason" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SaasSubscription" OWNER TO postgres;

--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "planId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'ACTIVE'::public."SubscriptionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO postgres;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    category public."BusinessCategory" NOT NULL,
    "logoUrl" text,
    address text,
    "phoneNumber" text,
    email text,
    "primaryColor" text,
    "secondaryColor" text,
    "websiteUrl" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "freeBranchOverride" integer DEFAULT 0 NOT NULL,
    "paidModeEnabled" boolean DEFAULT false NOT NULL,
    "freeUnitsLimit" integer DEFAULT 1 NOT NULL,
    "trialDurationDays" integer DEFAULT 28 NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "tenantId" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text,
    "phoneNumber" text,
    role public."Role" DEFAULT 'GYM_MEMBER'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "photoUrl" text,
    "businessData" jsonb,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text,
    password text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserBranch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserBranch" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "branchId" text NOT NULL,
    "accessLevel" public."AccessLevel" DEFAULT 'STAFF_ACCESS'::public."AccessLevel" NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    permissions jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserBranch" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Branch" (id, "tenantId", name, address, "phoneNumber", email, "isActive", "branchData", "createdAt", "updatedAt") FROM stdin;
552c8390-97a6-4866-bc39-1f7fb1c21344	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Muscle Mania Manggahan	123 Manggahan Street, Pasig City	\N	\N	t	\N	2025-08-15 21:15:08.711	2025-08-15 21:15:08.711
9e8006c1-435d-4233-a1fa-b6a354370b7a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Muscle Mania San Rafael	456 San Rafael Avenue, Bulacan	\N	\N	t	\N	2025-08-15 21:15:13.302	2025-08-15 21:15:13.302
acfee35d-14de-4888-97f5-48d49726ba76	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Muscle Mania San Jose	789 San Jose Road, Nueva Ecija	\N	\N	t	\N	2025-08-15 21:15:17.324	2025-08-15 21:15:17.324
e54b9b90-9405-4549-8c20-ead4b2fc191e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chakara Rosario	123 Rosario Street, Cavite	\N	\N	t	\N	2025-08-15 21:15:20.967	2025-08-15 21:15:20.967
3f1b2054-26d7-4895-84bb-0322ec7042b0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chakara San Rafael	456 San Rafael Avenue, Bataan	\N	\N	t	\N	2025-08-15 21:15:25.553	2025-08-15 21:15:25.553
b23e99db-5420-49c2-8781-bf5b4022405a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chakara Burgos	789 Burgos Road, Pangasinan	\N	\N	t	\N	2025-08-15 21:15:30.68	2025-08-15 21:15:30.68
\.


--
-- Data for Name: BusinessUnit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BusinessUnit" (id, "tenantId", name, "unitType", address, "phoneNumber", email, "isActive", "isPaid", "trialEndsAt", "subscriptionTier", "monthlyPrice", "businessUnitData", settings, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CustomerTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CustomerTransaction" (id, "tenantId", "customerId", "businessType", "transactionCategory", amount, currency, "taxAmount", "discountAmount", "netAmount", "paymentMethod", "paymentReference", "gatewayTransactionId", "transactionType", status, "relatedEntityType", "relatedEntityId", "relatedEntityName", description, notes, metadata, "processedBy", "createdAt", "updatedAt") FROM stdin;
fceb5f84-cd4a-4b78-b4d6-a61f46eb8d2e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	d9b274b3-4612-4080-afe1-fca9f2676f5b	gym	membership	2500.00	PHP	0.00	0.00	2500.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-30 21:15:09.434	2025-08-15 21:15:09.453
d14ee65c-85da-42cc-85da-9984169c211f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	06f6b164-7dfd-4ad7-88c0-c9ae71aefd87	gym	membership	12000.00	PHP	0.00	0.00	12000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-12 21:15:09.804	2025-08-15 21:15:09.822
bee89c21-088d-4884-8597-4aea093ed687	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	2cdcdde8-2186-4b3b-a85b-0425fceaa4cb	gym	membership	1200.00	PHP	0.00	0.00	1200.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-03-14 21:15:09.992	2025-08-15 21:15:10.01
dae762ae-334e-411b-bb34-95c58b29ae83	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	13fae61b-191a-40e9-b101-7eef30491653	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-06 21:15:10.36	2025-08-15 21:15:10.377
a7707580-7696-48bd-a2e9-b45554359d7e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9ea655bd-4bc9-40bc-887c-9087e6678658	gym	membership	12000.00	PHP	0.00	0.00	12000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-12-01 21:15:10.547	2025-08-15 21:15:10.565
449b111e-2819-43fe-8c7a-aa8a41c7f8ff	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	e1a36b51-7d48-49fd-8306-3661f50de347	gym	membership	150.00	PHP	0.00	0.00	150.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-12-16 21:15:10.735	2025-08-15 21:15:10.753
ff9815e6-ab4b-4a28-96c6-2f1084e12d83	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	a5876288-ddff-4c74-878f-5b9762e08aab	gym	membership	20000.00	PHP	0.00	0.00	20000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-17 21:15:10.918	2025-08-15 21:15:10.935
2f9227ee-ab7f-4cb8-ac96-9077a29c087d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	585e7aeb-f15b-40ed-baad-2d6bc65022c1	gym	membership	800.00	PHP	0.00	0.00	800.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-03 21:15:11.1	2025-08-15 21:15:11.117
f3862a89-e353-4cec-8d7f-49f1a8d04da3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	88f7822d-7d0f-4086-bf04-c060ac7be4bc	gym	membership	800.00	PHP	0.00	0.00	800.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-10-23 21:15:11.46	2025-08-15 21:15:11.477
ffb4768c-4539-41fb-83ad-507ade23a367	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	639a83aa-f46f-4606-88af-55a4dd02c426	gym	membership	800.00	PHP	0.00	0.00	800.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-09-23 21:15:11.641	2025-08-15 21:15:11.658
4abacc06-fffe-4676-a9d1-20e1e10acc8a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	e3841aaa-cd05-4920-b236-76b6a22a683d	gym	membership	12000.00	PHP	0.00	0.00	12000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-06-09 21:15:11.824	2025-08-15 21:15:11.842
1e653a23-6452-426b-9cb7-2265c035916e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	5a589fc7-f6e9-4ad5-8823-4e1e09e2d009	gym	membership	800.00	PHP	0.00	0.00	800.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-03-13 21:15:12.012	2025-08-15 21:15:12.029
5a33e1be-444e-4ce3-acb3-2a126802882a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	40eb8a4b-f4aa-4583-b961-a68b6077638c	gym	membership	20000.00	PHP	0.00	0.00	20000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-07-28 21:15:12.194	2025-08-15 21:15:12.211
c46acb7a-6f69-4610-83a1-7f470f669c28	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	d1a1c54a-cc81-4748-8bf0-749e288d1513	gym	membership	1200.00	PHP	0.00	0.00	1200.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-17 21:15:12.376	2025-08-15 21:15:12.393
047b46b2-6502-4db4-a696-6a6b6294075b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	d1a1c54a-cc81-4748-8bf0-749e288d1513	gym	membership	1200.00	PHP	0.00	0.00	1200.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Basic Monthly	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-17 21:15:12.376	2025-08-15 21:15:12.396
85817989-efb5-4a5e-88c0-4b30e573e85d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	6ee2317c-d4db-4ab1-811a-5a0518170334	gym	membership	12000.00	PHP	0.00	0.00	12000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-01-09 21:15:12.56	2025-08-15 21:15:12.577
4e0b835f-5d2c-48d2-b606-cd1c6b3c6ae6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	7b4241a4-d346-4ce6-9a5f-5b65d2898b53	gym	membership	20000.00	PHP	0.00	0.00	20000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-12 21:15:12.742	2025-08-15 21:15:12.75
a164f12b-df5e-48a0-b456-61bd7994edf9	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	d4340de3-112d-4c75-8c34-71fadc980e2e	gym	membership	2500.00	PHP	0.00	0.00	2500.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-15 21:15:12.917	2025-08-15 21:15:12.934
64625be4-6d83-44ae-b6c9-92d6ee39d68c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	5530a1b4-2b3d-4db3-af3a-ca59a0ba7b31	gym	membership	1200.00	PHP	0.00	0.00	1200.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-19 21:15:13.098	2025-08-15 21:15:13.115
0fe4e1ec-826f-4408-b723-0fef669ba17a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	1f7502dd-2a0f-4131-8300-affd8822c509	gym	membership	150.00	PHP	0.00	0.00	150.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-22 21:15:13.279	2025-08-15 21:15:13.296
6bc8d295-cebb-4172-8169-cfc4e18a54d8	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	8ecf2bb7-4fdb-41c7-b615-8ed01690d6a6	gym	membership	20000.00	PHP	0.00	0.00	20000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-18 21:15:14.002	2025-08-15 21:15:14.009
13d2dc1e-0f2a-47a8-8c89-6b1e8c3c471c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	a63a6b34-9f04-4d0a-8ee8-48268bfe66a0	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-02-17 21:15:14.174	2025-08-15 21:15:14.191
ce24a7d5-2341-489e-8891-8d927432954b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	64ca15dc-77e0-4312-9a01-34c03133c013	gym	membership	2500.00	PHP	0.00	0.00	2500.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-07-20 21:15:14.355	2025-08-15 21:15:14.372
9e06bd57-370d-4603-a1e5-8364ad05b049	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	dc41b15c-9291-4f4d-9f3c-93d555c5ea9b	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-23 21:15:14.54	2025-08-15 21:15:14.558
ef1044b6-1c62-4f51-a475-82b576224217	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	7c8ac662-a5f2-44a5-8751-e115855f49c6	gym	membership	150.00	PHP	0.00	0.00	150.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-12 21:15:14.724	2025-08-15 21:15:14.741
6ef1fef4-b806-4c39-95cf-efc560e76ddb	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	e0c9cf5b-bd38-47b5-b157-673087594195	gym	membership	150.00	PHP	0.00	0.00	150.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-07 21:15:14.908	2025-08-15 21:15:14.916
daee4656-e03a-43fc-9581-b9dca25b7f89	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	26cf28c0-fa6d-4a68-b300-c1b78b174e38	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-06-12 21:15:15.083	2025-08-15 21:15:15.09
0e212512-e93b-44a5-a6f2-34d0f349ecc5	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	bd3a1fdf-1b4a-4293-b0d7-6afecf284db1	gym	membership	150.00	PHP	0.00	0.00	150.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-01-25 21:15:15.253	2025-08-15 21:15:15.27
1ca257c5-6fa2-417c-a424-1dc5f6308bf0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	a2d92660-477e-4804-a4ee-defa4fea6db6	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-03-31 21:15:15.436	2025-08-15 21:15:15.452
07bfcd5e-616d-4d3d-8a18-6612a1b091e0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	ed7b4704-9872-4e7f-a799-2a08a4694241	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-21 21:15:15.616	2025-08-15 21:15:15.633
df92063f-c0c0-46cc-833d-02ae286a27a0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	f9e935d8-2de6-44fc-a2d4-d7f9a58a4224	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-27 21:15:15.798	2025-08-15 21:15:15.816
46e486ed-4bfe-4d79-9a0c-b00cc069a32c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	0f3f75a5-257a-4ecc-bd35-d9ce44e44510	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-01-24 21:15:15.991	2025-08-15 21:15:16.008
95e96b89-225e-4b79-aaf2-6fd6162fedc1	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	a782550d-3c55-4360-b04b-592f7fcb7251	gym	membership	800.00	PHP	0.00	0.00	800.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-10-05 21:15:16.173	2025-08-15 21:15:16.19
3261ac1d-e096-4c84-b1a1-b053c429b1c3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	a44fd54f-c58d-447f-ada5-d5550dfac49a	gym	membership	150.00	PHP	0.00	0.00	150.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-02-19 21:15:16.361	2025-08-15 21:15:16.379
7d6cda2f-b8cf-4e17-aa33-3cf66f233fd8	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	4f8cb99f-4027-4cbe-94c1-203953439e37	gym	membership	150.00	PHP	0.00	0.00	150.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-10-17 21:15:16.566	2025-08-15 21:15:16.584
fe9f9c90-e08a-4ae4-9f85-a4f4f038e9f3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	0cf489e8-4901-48b5-95a3-b865c9ec4e7d	gym	membership	20000.00	PHP	0.00	0.00	20000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-06-21 21:15:16.749	2025-08-15 21:15:16.766
72ab53b2-3f2c-4690-9f1e-7906aca52a6d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	b64c164b-200f-4fa2-b3ef-0fb8f1a2885b	gym	membership	1200.00	PHP	0.00	0.00	1200.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-08-27 21:15:16.935	2025-08-15 21:15:16.943
024cd358-1ee5-411d-abd6-bde426ccfd2a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	6041c766-6626-4b46-8a0c-1d29b464e6d3	gym	membership	20000.00	PHP	0.00	0.00	20000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-02-10 21:15:17.3	2025-08-15 21:15:17.318
8585e0db-ee38-4986-83aa-20745043cd8b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	b29d347c-9ead-4449-ad79-3c6e87c24acc	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-17 21:15:18.027	2025-08-15 21:15:18.045
496738ea-761d-4af5-915b-386963e0c5e0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	6ff363cd-6c14-46f1-ae83-349ee293ea20	gym	membership	150.00	PHP	0.00	0.00	150.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-01-25 21:15:18.212	2025-08-15 21:15:18.227
6d2969d9-294b-4302-b558-00a4893b9c07	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	294a9115-ad8c-4b7a-aaaa-bbe6ac9eb834	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-24 21:15:18.568	2025-08-15 21:15:18.585
49df5d2b-0aea-4248-87a4-98b2d27e33f1	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	235d201b-9a65-4f56-be06-fb7707e7e26b	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-08-25 21:15:18.75	2025-08-15 21:15:18.767
9755a32c-a17d-4d5d-a970-c6a05e506489	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	76a2b8f3-4285-488f-8802-443a7795c971	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-08-19 21:15:18.933	2025-08-15 21:15:18.95
9b70d3ec-60c2-4d08-b8d4-e46bb3c713e3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	795e3897-f051-4f99-bd3e-144e3eb75a2d	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-10 21:15:19.115	2025-08-15 21:15:19.132
070b6fa0-cc9d-4de2-9e95-c2ba153326c4	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	0a3ff09b-fb4f-48aa-834e-1f3242c71191	gym	membership	20000.00	PHP	0.00	0.00	20000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-20 21:15:19.299	2025-08-15 21:15:19.316
b2f029fd-40b6-4f11-9a93-240c462d5e18	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	bdfb52b4-4099-43b6-a5ad-e105d73ee9cd	gym	membership	150.00	PHP	0.00	0.00	150.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-10-04 21:15:19.482	2025-08-15 21:15:19.499
46f2dc50-a7a3-407b-abb1-26acbb860f64	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	838c2609-41f0-4370-95f0-706698b35c2c	gym	membership	150.00	PHP	0.00	0.00	150.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-04-22 21:15:19.666	2025-08-15 21:15:19.673
8a88446d-329c-46fa-ab20-954e7ce45261	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9dc6450b-37bd-489a-8053-ce0c673cf484	gym	membership	150.00	PHP	0.00	0.00	150.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-11-07 21:15:19.838	2025-08-15 21:15:19.846
4d3bf74c-fbc8-4640-a354-ec6dddabd3e9	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	baafbac5-b320-4a5b-b113-4b332d15a351	gym	membership	12000.00	PHP	0.00	0.00	12000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-07-15 21:15:20.011	2025-08-15 21:15:20.019
40eeb6c2-47e9-465c-b722-d933c6c9fead	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9339893c-3a56-4e48-8613-8fd3962ed2da	gym	membership	1200.00	PHP	0.00	0.00	1200.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-05-14 21:15:20.185	2025-08-15 21:15:20.193
196302c8-1bc0-477c-9813-a2f5eb6bfbcb	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	a6c57000-0c2c-4d31-83e6-e0244c497009	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-03-01 21:15:20.361	2025-08-15 21:15:20.379
53750001-ff00-413d-8c6a-f620cc09fde9	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	bda45883-e863-4814-bdcf-9554683c43b2	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-14 21:15:20.551	2025-08-15 21:15:20.569
b46e09e3-7b79-4a7d-89f6-e87c1c5fe94f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	bda45883-e863-4814-bdcf-9554683c43b2	gym	membership	1200.00	PHP	0.00	0.00	1200.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Basic Monthly	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-09-14 21:15:20.551	2025-08-15 21:15:20.572
74cf546e-3785-45e8-9258-3cc4bfa18cd3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	91c3108c-aa48-4b84-9bf3-d284889d4fa5	gym	membership	12000.00	PHP	0.00	0.00	12000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2024-12-29 21:15:20.743	2025-08-15 21:15:20.761
e5c19d12-5e3a-4eec-85f4-aebe87001e0d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	6bf33357-06b2-4d2c-945b-8891389fb68b	gym	membership	1200.00	PHP	0.00	0.00	1200.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-09-22 21:15:22.041	2025-08-15 21:15:22.058
1478c113-fee5-48bf-9566-4c52be2e76d5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	8a02baab-c306-429e-b620-077e917badd0	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-01 21:15:22.226	2025-08-15 21:15:22.243
8039af7e-1830-47e1-867d-ccb305efc0c3	d9e2fdf8-6b16-4340-97ec-5eace22acc57	dfd3b910-7871-4e6e-a839-4590947b517d	gym	membership	20000.00	PHP	0.00	0.00	20000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-02 21:15:22.587	2025-08-15 21:15:22.605
343c5282-e80a-4789-b3c3-d13033fddc20	d9e2fdf8-6b16-4340-97ec-5eace22acc57	c74961d3-ba1c-4ee5-aeb2-44877ef69675	gym	membership	20000.00	PHP	0.00	0.00	20000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-23 21:15:22.956	2025-08-15 21:15:22.974
55cc81f6-657a-4f2d-ae57-cf99af1753e7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	c888a561-f343-4903-8403-fa3e344700bf	gym	membership	20000.00	PHP	0.00	0.00	20000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-20 21:15:23.145	2025-08-15 21:15:23.163
0ab51460-79f5-45ea-bea7-512b7fac078c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	4c76499d-0a6e-483b-9abc-717b4719e48b	gym	membership	1200.00	PHP	0.00	0.00	1200.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-24 21:15:23.332	2025-08-15 21:15:23.341
605fe533-6bf5-4297-8c69-2b9d03844530	d9e2fdf8-6b16-4340-97ec-5eace22acc57	4c76499d-0a6e-483b-9abc-717b4719e48b	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Basic Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-24 21:15:23.332	2025-08-15 21:15:23.344
6780791b-873c-4173-9913-5edfd3e0f72a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3a1b2349-5c38-410d-afe2-e00841274936	gym	membership	150.00	PHP	0.00	0.00	150.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-04-22 21:15:23.515	2025-08-15 21:15:23.533
c5c7c0e0-fbd0-4eef-a341-b32ce6b6d8bc	d9e2fdf8-6b16-4340-97ec-5eace22acc57	4053317b-c36e-4cfa-afc3-380077c8eeb1	gym	membership	800.00	PHP	0.00	0.00	800.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-03 21:15:23.711	2025-08-15 21:15:23.729
fb4b97f7-f46b-4520-94c3-424647454d0d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e4624fb5-1793-4b5d-806e-491ebeec1583	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-09-16 21:15:23.912	2025-08-15 21:15:23.923
c1677b2c-2274-4632-aba8-2177527e0a11	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b5712765-0812-49e4-a8f5-daa61a3f5791	gym	membership	2500.00	PHP	0.00	0.00	2500.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-01 21:15:24.158	2025-08-15 21:15:24.179
fdfac292-f7fa-4233-825c-6235402bfb64	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3d65100b-25ab-46fd-b4a2-f1d4df263ca8	gym	membership	2500.00	PHP	0.00	0.00	2500.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-07 21:15:24.398	2025-08-15 21:15:24.416
138c5e9c-92ca-4b6a-8993-aadf7a122dbd	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3d65100b-25ab-46fd-b4a2-f1d4df263ca8	gym	membership	2500.00	PHP	0.00	0.00	2500.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Premium Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-12-07 21:15:24.398	2025-08-15 21:15:24.42
72bda6a6-f9ca-470f-aeaf-f3c7ad31cf9d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	bd53a564-62dc-4e71-b287-fbc4aa95ff45	gym	membership	150.00	PHP	0.00	0.00	150.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-05-05 21:15:24.62	2025-08-15 21:15:24.628
d00c8b56-8d3c-4534-b355-211cd71fecdc	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e12a9403-9e52-4bb6-8b0d-c2c80498686c	gym	membership	20000.00	PHP	0.00	0.00	20000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-04 21:15:24.795	2025-08-15 21:15:24.812
5adc11e6-5f58-4dc7-8d7b-a2641f1c648d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	fddd6a86-ad1c-46a9-ad42-a14899bc45f0	gym	membership	12000.00	PHP	0.00	0.00	12000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-23 21:15:24.981	2025-08-15 21:15:24.998
2460adc2-d74b-412c-8c07-1d681034052d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	16b625c7-5530-4ceb-8c8e-91d66a653f52	gym	membership	20000.00	PHP	0.00	0.00	20000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-07 21:15:25.163	2025-08-15 21:15:25.18
be433a72-d612-402c-a046-269c37f4a5ed	d9e2fdf8-6b16-4340-97ec-5eace22acc57	5defd169-d762-49f3-bb8d-0efdceed53ac	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-30 21:15:25.345	2025-08-15 21:15:25.362
61b505a4-a78e-4226-bbf0-81ab46fe15ff	d9e2fdf8-6b16-4340-97ec-5eace22acc57	5defd169-d762-49f3-bb8d-0efdceed53ac	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Premium Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-08-30 21:15:25.345	2025-08-15 21:15:25.365
a0e991c5-24b6-45b4-9cf9-45badadbea2a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	4597f4c8-2e9f-4b7b-8e5c-565df03c6c3c	gym	membership	1200.00	PHP	0.00	0.00	1200.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-25 21:15:25.53	2025-08-15 21:15:25.547
0712437b-cf7d-444d-9e2f-912d288d2aa9	d9e2fdf8-6b16-4340-97ec-5eace22acc57	5ea148ca-2a67-4b8d-91d3-f1de3d6bbd7a	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-12-29 21:15:26.248	2025-08-15 21:15:26.266
fbb93294-975a-4022-a9e2-79084487f7ab	d9e2fdf8-6b16-4340-97ec-5eace22acc57	ee3f7e0d-c0d0-4669-a68a-48be3aaad08b	gym	membership	150.00	PHP	0.00	0.00	150.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-05-21 21:15:26.43	2025-08-15 21:15:26.438
232a0eb1-9246-4b7b-bffe-f55063f5ea9c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	7c7b5744-de44-4444-9f89-744ac7610479	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-02-06 21:15:26.607	2025-08-15 21:15:26.624
53b6547b-9c8c-4916-8105-44cf4ae1f02a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	859d77d6-2632-4669-8bc2-85a36e21600d	gym	membership	150.00	PHP	0.00	0.00	150.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-29 21:15:26.789	2025-08-15 21:15:26.806
2fdd511c-f3c7-49e6-b23d-a17691a8f024	d9e2fdf8-6b16-4340-97ec-5eace22acc57	10c7b2fe-820b-474a-a7ed-6b2224a60e52	gym	membership	2500.00	PHP	0.00	0.00	2500.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-06 21:15:26.973	2025-08-15 21:15:26.991
42588938-bf4e-4fff-ab23-f3df05146f4f	d9e2fdf8-6b16-4340-97ec-5eace22acc57	50730399-c746-4588-9db6-1874648c9b0e	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-17 21:15:27.156	2025-08-15 21:15:27.174
2360f3c6-2e20-4474-8136-f8204d3b36a0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	41f2b890-95b7-4c88-a143-459fcbbab863	gym	membership	1200.00	PHP	0.00	0.00	1200.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-12 21:15:27.338	2025-08-15 21:15:27.356
514fd63c-76c3-4d92-a4d2-655a5c585505	d9e2fdf8-6b16-4340-97ec-5eace22acc57	41f2b890-95b7-4c88-a143-459fcbbab863	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Basic Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-12-12 21:15:27.338	2025-08-15 21:15:27.359
38be37b3-f1ae-40be-8731-524fb8eea7bc	d9e2fdf8-6b16-4340-97ec-5eace22acc57	5e64e217-26b5-4748-b30a-43d59f3ce3b5	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-04 21:15:27.525	2025-08-15 21:15:27.543
50163bb9-44c4-47a2-8c10-4f76b2f91595	d9e2fdf8-6b16-4340-97ec-5eace22acc57	c072b241-12dd-4215-819d-7e22ba74a8c6	gym	membership	20000.00	PHP	0.00	0.00	20000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-19 21:15:27.898	2025-08-15 21:15:27.916
d65f8fe4-20c4-42f4-806f-dea345a07ef3	d9e2fdf8-6b16-4340-97ec-5eace22acc57	0724e47d-dcf1-4de8-b832-48dd78c8ba58	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-04-26 21:15:28.094	2025-08-15 21:15:28.111
5554ed6a-c7e5-483b-87a5-afa646f40f6a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	6232bf09-1929-46e9-86dd-73fee1e51308	gym	membership	800.00	PHP	0.00	0.00	800.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-13 21:15:28.28	2025-08-15 21:15:28.298
41163401-88c8-4c10-a7be-a8d6c72c8e51	d9e2fdf8-6b16-4340-97ec-5eace22acc57	48891e1a-6049-4ed8-88a4-1315969f47bf	gym	membership	800.00	PHP	0.00	0.00	800.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-12-09 21:15:28.463	2025-08-15 21:15:28.48
c2fdcf78-e082-4a4f-8aa5-93f24bc0e56e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	eceffe21-0f38-4e3b-a22a-c7c2ae268c7f	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-04-14 21:15:28.645	2025-08-15 21:15:28.662
c1324470-56ed-4e1c-8a51-08101de57bc7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	9ef87d13-3400-4719-a5c2-3e132410eeef	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-20 21:15:28.827	2025-08-15 21:15:28.844
edd9a182-be55-46be-a6dd-b78683c8507e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	52da20cd-a142-44f0-899e-58fc55cc66ff	gym	membership	20000.00	PHP	0.00	0.00	20000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-27 21:15:29.009	2025-08-15 21:15:29.026
16c9835b-d2d7-43a5-83ee-14bacdd0754d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	698bb930-e4eb-46e1-85d6-0b1b0ba5761e	gym	membership	12000.00	PHP	0.00	0.00	12000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-23 21:15:29.191	2025-08-15 21:15:29.208
093a4eba-762e-4752-a3db-ff09b81022df	d9e2fdf8-6b16-4340-97ec-5eace22acc57	06af4d42-3e87-4dad-aa28-ee1b7b3897c9	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-04 21:15:29.373	2025-08-15 21:15:29.391
7f218ace-20ac-4170-a7ea-9d9d66f87ffd	d9e2fdf8-6b16-4340-97ec-5eace22acc57	48d488c3-0fcd-4b71-809c-191bbc258e0f	gym	membership	20000.00	PHP	0.00	0.00	20000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-13 21:15:29.556	2025-08-15 21:15:29.574
0ca3bcc0-bf48-4bb1-ae37-fadbafb1b3ae	d9e2fdf8-6b16-4340-97ec-5eace22acc57	cf9b15ae-9323-4ea9-a3e8-e8d9a3218abe	gym	membership	20000.00	PHP	0.00	0.00	20000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-02 21:15:29.738	2025-08-15 21:15:29.756
71a30ca1-085f-418f-829c-b8458f340234	d9e2fdf8-6b16-4340-97ec-5eace22acc57	1b2b2615-4838-4bac-ab4b-57c279a62b05	gym	membership	800.00	PHP	0.00	0.00	800.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-25 21:15:29.923	2025-08-15 21:15:29.94
580d7daa-3344-45c1-b4e8-b25fc69b18b7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	1896ee49-7e84-408a-a955-8ff335544891	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-02 21:15:30.105	2025-08-15 21:15:30.123
57b776c2-63f4-4841-816b-08e2dd42e9ee	d9e2fdf8-6b16-4340-97ec-5eace22acc57	1896ee49-7e84-408a-a955-8ff335544891	gym	membership	2500.00	PHP	0.00	0.00	2500.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Premium Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-04-02 21:15:30.105	2025-08-15 21:15:30.126
4cbfc407-6ee6-4ece-be71-191ebd060318	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3d11dce9-9336-413d-931f-f82ee9fecc8a	gym	membership	12000.00	PHP	0.00	0.00	12000.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-08 21:15:30.29	2025-08-15 21:15:30.308
87f1065f-bb27-419b-8ee0-abedc5a7c866	d9e2fdf8-6b16-4340-97ec-5eace22acc57	416ed71f-e7f1-4f6b-9691-924f830d6904	gym	membership	1200.00	PHP	0.00	0.00	1200.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-24 21:15:30.472	2025-08-15 21:15:30.489
8430771a-7a1c-4977-938b-6847f6b0ce29	d9e2fdf8-6b16-4340-97ec-5eace22acc57	416ed71f-e7f1-4f6b-9691-924f830d6904	gym	membership	1200.00	PHP	0.00	0.00	1200.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Basic Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-08-24 21:15:30.472	2025-08-15 21:15:30.493
27f7a17a-f8e3-46c8-ac20-74ca0a950d54	d9e2fdf8-6b16-4340-97ec-5eace22acc57	f82a06f6-e805-461b-94a2-c2ce6a9e9c91	gym	membership	20000.00	PHP	0.00	0.00	20000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-20 21:15:30.657	2025-08-15 21:15:30.674
8da5ecdc-c72e-44cf-88c0-e9470592e2b7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	541a91d9-0241-41f9-9bed-a7cab725a7d7	gym	membership	150.00	PHP	0.00	0.00	150.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-10 21:15:31.362	2025-08-15 21:15:31.379
109c10f1-f6e3-4d57-84f0-9662fda616a0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	bb4e114c-2d7b-476a-bbf3-67c50896fb2e	gym	membership	800.00	PHP	0.00	0.00	800.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-08-01 21:15:31.544	2025-08-15 21:15:31.561
f9e4e70f-e451-410e-9fec-ac9993db7eb3	d9e2fdf8-6b16-4340-97ec-5eace22acc57	5100d597-560d-489d-af2d-235076f30841	gym	membership	800.00	PHP	0.00	0.00	800.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-05 21:15:31.725	2025-08-15 21:15:31.743
818741c2-071b-4c55-ae80-795e9c37a674	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e915fb04-b580-40ae-8a35-7eb07949c507	gym	membership	2500.00	PHP	0.00	0.00	2500.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-09-20 21:15:31.909	2025-08-15 21:15:31.926
d6ee86a4-6816-47f3-ab73-b9082e577746	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e915fb04-b580-40ae-8a35-7eb07949c507	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Premium Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-20 21:15:31.909	2025-08-15 21:15:31.929
787ec34f-2b04-47c3-82fd-5f3bd7cfc896	d9e2fdf8-6b16-4340-97ec-5eace22acc57	bbe614ae-2383-4f72-90af-e4f59722eb36	gym	membership	1200.00	PHP	0.00	0.00	1200.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-06-14 21:15:32.098	2025-08-15 21:15:32.115
3944be6c-044e-493c-aa50-b264fe85f0bc	d9e2fdf8-6b16-4340-97ec-5eace22acc57	4fe8a88d-32f5-47d9-bef2-73f69b5d7491	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-15 21:15:32.279	2025-08-15 21:15:32.297
a6a348a6-0560-4933-a41d-c20227981640	d9e2fdf8-6b16-4340-97ec-5eace22acc57	eeae7ae6-a1ff-4ace-aa80-6ff1065add60	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-19 21:15:32.462	2025-08-15 21:15:32.479
aab862ad-8676-4d8c-a11d-67387d60a8af	d9e2fdf8-6b16-4340-97ec-5eace22acc57	eeae7ae6-a1ff-4ace-aa80-6ff1065add60	gym	membership	2500.00	PHP	0.00	0.00	2500.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Premium Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-19 21:15:32.462	2025-08-15 21:15:32.481
505c5018-3a39-4783-80d1-3c3d192f0654	d9e2fdf8-6b16-4340-97ec-5eace22acc57	c5b213ab-6caf-4b7c-ab4c-909ea92117fe	gym	membership	12000.00	PHP	0.00	0.00	12000.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-01-31 21:15:32.647	2025-08-15 21:15:32.664
0342681e-f86e-4d65-830b-cfd47b91e71d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	34773a75-10d7-4371-a9af-40cfaccb78dc	gym	membership	20000.00	PHP	0.00	0.00	20000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Corporate Package membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-23 21:15:32.846	2025-08-15 21:15:32.854
53bcd0ca-34af-48db-ad66-00774ec25245	d9e2fdf8-6b16-4340-97ec-5eace22acc57	a541f0b2-43c6-471a-823c-7ed166b3095c	gym	membership	150.00	PHP	0.00	0.00	150.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-04-24 21:15:33.044	2025-08-15 21:15:33.061
a1fbb34e-398e-42be-bff1-ec93562ee6ec	d9e2fdf8-6b16-4340-97ec-5eace22acc57	67214f3c-db70-4264-8958-d659939a2d4c	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-20 21:15:33.242	2025-08-15 21:15:33.259
477aad97-bdc2-498d-ad6c-052cd6cdc6a7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	0d76c3a8-b881-4273-829e-eca4280cf0cb	gym	membership	2500.00	PHP	0.00	0.00	2500.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-02-23 21:15:33.437	2025-08-15 21:15:33.446
ea7124cb-ccce-4a95-87dd-202ac4f046c1	d9e2fdf8-6b16-4340-97ec-5eace22acc57	0d76c3a8-b881-4273-829e-eca4280cf0cb	gym	membership	2500.00	PHP	0.00	0.00	2500.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Premium Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-23 21:15:33.437	2025-08-15 21:15:33.449
d15cdafd-66b0-45e0-91f8-ef83c4fd9841	d9e2fdf8-6b16-4340-97ec-5eace22acc57	0dd97c34-d21b-4d40-9a2d-44bb5ca372b1	gym	membership	12000.00	PHP	0.00	0.00	12000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-19 21:15:33.644	2025-08-15 21:15:33.662
d7fa25d1-eae6-4871-9594-e56773577714	d9e2fdf8-6b16-4340-97ec-5eace22acc57	9bf15681-7144-4a2b-bdf7-cea7da068f47	gym	membership	150.00	PHP	0.00	0.00	150.00	cash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Day Pass membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-05-14 21:15:33.852	2025-08-15 21:15:33.86
42905d14-a37d-4d88-8ba0-dca9083de99a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	88951605-b502-4327-b8b7-8f0574dc7141	gym	membership	2500.00	PHP	0.00	0.00	2500.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Premium Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-12-28 21:15:34.046	2025-08-15 21:15:34.064
0aa6fd93-3e03-4dd6-9e87-8eb46e1b0489	d9e2fdf8-6b16-4340-97ec-5eace22acc57	d3e8af3e-565b-4730-b4f1-8aa39dd4c4ce	gym	membership	1200.00	PHP	0.00	0.00	1200.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-07-23 21:15:34.251	2025-08-15 21:15:34.269
90b6b159-a030-41be-b9eb-2e39cd092d9b	d9e2fdf8-6b16-4340-97ec-5eace22acc57	87f2519b-93a2-4723-9bed-5ece8cba43c9	gym	membership	12000.00	PHP	0.00	0.00	12000.00	card	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-04-09 21:15:34.461	2025-08-15 21:15:34.48
a3e4951d-d0be-484e-8dad-7e83b5020d8e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	7ff92cd0-7706-4c5c-a825-469accf3867a	gym	membership	12000.00	PHP	0.00	0.00	12000.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Annual Basic membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-11-19 21:15:34.676	2025-08-15 21:15:34.685
0d115933-ee65-4b33-a1b3-8d06d27e37f2	d9e2fdf8-6b16-4340-97ec-5eace22acc57	cbf3fb80-71db-4137-96ae-690e6850d123	gym	membership	1200.00	PHP	0.00	0.00	1200.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Basic Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-09-26 21:15:34.871	2025-08-15 21:15:34.889
1c8bf465-5e12-4b24-a55e-564c6c954522	d9e2fdf8-6b16-4340-97ec-5eace22acc57	cbf3fb80-71db-4137-96ae-690e6850d123	gym	membership	1200.00	PHP	0.00	0.00	1200.00	bank_transfer	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Monthly renewal payment for Basic Monthly	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2024-10-26 21:15:34.871	2025-08-15 21:15:34.892
84991603-9a0c-4b77-99a8-47df5e892785	d9e2fdf8-6b16-4340-97ec-5eace22acc57	d231ee48-9bdf-4715-ae5b-438a67e59930	gym	membership	800.00	PHP	0.00	0.00	800.00	gcash	\N	\N	PAYMENT	COMPLETED	\N	\N	\N	Initial payment for Student Monthly membership	\N	\N	9380fa3e-bad2-4113-b2e6-69d657daa575	2025-03-27 21:15:35.078	2025-08-15 21:15:35.087
fbe6bca4-3f52-46bb-9a13-d011db45b847	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	2875895a-da05-4fe7-bec3-2d3a1c004a4f	gym	membership	1200.00	PHP	0.00	0.00	1200.00	CASH	\N	\N	PAYMENT	COMPLETED	membership_plan	2c12ab83-b7b1-47f6-88b8-d25381c7c213	Basic Monthly	Gym membership renewal: Basic Monthly	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 03:37:34.541	2025-08-16 03:37:34.541
71cf950e-6e76-4776-b270-e3e9c85f1c25	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	f82d6622-da5d-4c7a-b471-5d586e6d58f9	gym	membership	800.00	PHP	0.00	0.00	800.00	CASH	\N	\N	PAYMENT	COMPLETED	membership_plan	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	Student Monthly	Gym membership renewal: Student Monthly	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 03:37:50.351	2025-08-16 03:37:50.351
e780b4fc-e38a-420d-a3e6-34de0bf5c599	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	f8522206-fe3f-4430-90ec-2227a7f74b04	gym	membership	800.00	PHP	0.00	0.00	800.00	CASH	\N	\N	PAYMENT	COMPLETED	membership_plan	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	Student Monthly	Gym membership renewal: Student Monthly	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:41:45.202	2025-08-16 05:41:45.202
a2be0293-3ec7-4b4c-8d00-e51048cca5c2	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	cd266fd9-21b6-47cd-a42c-080a1ced11ee	gym	membership	12000.00	PHP	0.00	0.00	12000.00	CASH	\N	\N	PAYMENT	COMPLETED	membership_plan	57f58dee-30ac-4d9f-8533-5e31d5607377	Annual Basic	Gym membership renewal: Annual Basic	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:10:17.325	2025-08-16 06:10:17.325
6c7d6cf9-939b-4dcb-b764-16441d576f4e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	25a78382-a9a5-48b4-9cb0-e5cb15331193	gym	membership	12000.00	PHP	0.00	0.00	12000.00	CASH	\N	\N	PAYMENT	COMPLETED	membership_plan	57f58dee-30ac-4d9f-8533-5e31d5607377	Annual Basic	Gym membership renewal: Annual Basic	\N	\N	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:19:14.373	2025-08-16 06:19:14.373
\.


--
-- Data for Name: GymMemberSubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GymMemberSubscription" (id, "tenantId", "branchId", "memberId", "membershipPlanId", status, "startDate", "endDate", price, currency, "usageData", "cancelledAt", "cancellationReason", "cancellationNotes", "autoRenew", "nextBillingDate", "createdAt", "updatedAt") FROM stdin;
bee2359c-f5ae-41bb-945a-c54c282d5529	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	d9b274b3-4612-4080-afe1-fca9f2676f5b	8af0b42f-e67f-41e1-a044-371f4a000f65	EXPIRED	2025-04-30	2025-05-22	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:09.449	2025-08-15 21:15:09.449
0dd9021d-ea98-4498-b7ef-91d458e9c5e9	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	06f6b164-7dfd-4ad7-88c0-c9ae71aefd87	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2024-11-12	2025-09-25	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:09.818	2025-08-15 21:15:09.818
b37326be-3c97-4fcd-9ea7-6f778f5b140d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	2cdcdde8-2186-4b3b-a85b-0425fceaa4cb	2c12ab83-b7b1-47f6-88b8-d25381c7c213	ACTIVE	2025-03-14	2025-11-05	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:10.007	2025-08-15 21:15:10.007
657fb716-6d39-483d-b4d0-f9b9c531f2ee	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	13fae61b-191a-40e9-b101-7eef30491653	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2025-05-06	2025-11-20	800.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:10.374	2025-08-15 21:15:10.374
52959f6e-2fdf-42f6-8658-0e660053a81a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	9ea655bd-4bc9-40bc-887c-9087e6678658	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2024-12-01	2025-08-19	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:10.561	2025-08-15 21:15:10.561
6a2c348f-acf6-4ef2-8479-5703ac847946	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	e1a36b51-7d48-49fd-8306-3661f50de347	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2024-12-16	2025-10-08	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:10.749	2025-08-15 21:15:10.749
4097be52-8858-4633-bb60-6db1f1947986	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	a5876288-ddff-4c74-878f-5b9762e08aab	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2025-05-17	2025-08-16	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:10.932	2025-08-15 21:15:10.932
1a0860f9-395c-4292-8cca-fa67bd3a2cc6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	585e7aeb-f15b-40ed-baad-2d6bc65022c1	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2025-08-03	2025-11-26	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:11.114	2025-08-15 21:15:11.114
21161347-eebd-48ec-b4c9-02a66ac56e85	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	88f7822d-7d0f-4086-bf04-c060ac7be4bc	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2024-10-23	2025-11-10	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:11.474	2025-08-15 21:15:11.474
bb0888d1-0208-45f6-a310-bbe616d995c0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	639a83aa-f46f-4606-88af-55a4dd02c426	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2024-09-23	2025-11-09	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:11.655	2025-08-15 21:15:11.655
da44b1be-2ef7-40d7-8e44-de08fa6d7e78	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	e3841aaa-cd05-4920-b236-76b6a22a683d	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-06-09	2025-12-02	12000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:11.839	2025-08-15 21:15:11.839
cfcd6398-3914-4fda-ac13-28cd9df8ab65	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	5a589fc7-f6e9-4ad5-8823-4e1e09e2d009	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2025-03-13	2025-11-10	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:12.026	2025-08-15 21:15:12.026
c2b168a3-e67c-482c-9f9a-90534e5b8464	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	40eb8a4b-f4aa-4583-b961-a68b6077638c	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2025-07-28	2025-10-31	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:12.208	2025-08-15 21:15:12.208
778e98c4-8db6-4e76-9c14-f277b22f9d6a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	d1a1c54a-cc81-4748-8bf0-749e288d1513	2c12ab83-b7b1-47f6-88b8-d25381c7c213	ACTIVE	2025-04-17	2025-10-26	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:12.39	2025-08-15 21:15:12.39
6269db55-035a-47ca-bd9b-7939f0cd4840	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	6ee2317c-d4db-4ab1-811a-5a0518170334	57f58dee-30ac-4d9f-8533-5e31d5607377	EXPIRED	2025-01-09	2025-06-25	12000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:12.574	2025-08-15 21:15:12.574
6b9e544b-c0e7-4c55-92cc-d7e9ff24c03d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	7b4241a4-d346-4ce6-9a5f-5b65d2898b53	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2025-05-12	2025-12-08	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:12.747	2025-08-15 21:15:12.747
4d8ca3c0-cb62-4098-a787-52aa6015aa6f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	d4340de3-112d-4c75-8c34-71fadc980e2e	8af0b42f-e67f-41e1-a044-371f4a000f65	ACTIVE	2025-08-15	2025-11-02	2500.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:12.931	2025-08-15 21:15:12.931
3a7b0d4e-7349-49b5-920f-e315ae8b8e7c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	5530a1b4-2b3d-4db3-af3a-ca59a0ba7b31	2c12ab83-b7b1-47f6-88b8-d25381c7c213	ACTIVE	2024-11-19	2025-12-04	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:13.112	2025-08-15 21:15:13.112
87cd1e97-2dde-4546-915d-f20165c8508e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	552c8390-97a6-4866-bc39-1f7fb1c21344	1f7502dd-2a0f-4131-8300-affd8822c509	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2025-04-22	2025-11-06	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:13.293	2025-08-15 21:15:13.293
77d90710-3920-4107-a78c-8e84e14e20e8	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	8ecf2bb7-4fdb-41c7-b615-8ed01690d6a6	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2024-11-18	2025-08-15	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:14.006	2025-08-15 21:15:14.006
295767ea-3ce4-4ab7-b0d0-6f9a86a532c8	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	a63a6b34-9f04-4d0a-8ee8-48268bfe66a0	8af0b42f-e67f-41e1-a044-371f4a000f65	EXPIRED	2025-02-17	2025-07-26	2500.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:14.188	2025-08-15 21:15:14.188
c03e9064-3229-4dc6-88bd-b1f62fe313b9	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	64ca15dc-77e0-4312-9a01-34c03133c013	8af0b42f-e67f-41e1-a044-371f4a000f65	EXPIRED	2025-07-20	2025-07-05	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:14.369	2025-08-15 21:15:14.369
a3a808b3-ed43-434a-9456-d8c9ad7025bb	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	dc41b15c-9291-4f4d-9f3c-93d555c5ea9b	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-04-23	2025-09-30	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:14.555	2025-08-15 21:15:14.555
495983f2-ca1a-4d99-92ef-fdd0bfbcf5a8	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	7c8ac662-a5f2-44a5-8751-e115855f49c6	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2025-04-12	2025-09-15	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:14.738	2025-08-15 21:15:14.738
2dce4456-b800-4f59-b9b4-4a7d5827c9b8	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	e0c9cf5b-bd38-47b5-b157-673087594195	fd4a9391-7639-43a1-a6ae-e8516c73efd0	EXPIRED	2025-04-07	2025-08-04	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:14.912	2025-08-15 21:15:14.912
0781ae0f-2818-441c-9e38-86fcdcf13225	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	26cf28c0-fa6d-4a68-b300-c1b78b174e38	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-06-12	2025-12-10	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:15.087	2025-08-15 21:15:15.087
9337b316-50d3-4c23-ae0b-e924c98909a0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	bd3a1fdf-1b4a-4293-b0d7-6afecf284db1	fd4a9391-7639-43a1-a6ae-e8516c73efd0	EXPIRED	2025-01-25	2025-06-14	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:15.267	2025-08-15 21:15:15.267
19b16b1c-fec1-42ae-a6b4-3c8b4c7b3242	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	a2d92660-477e-4804-a4ee-defa4fea6db6	57f58dee-30ac-4d9f-8533-5e31d5607377	EXPIRED	2025-03-31	2025-07-14	12000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:15.45	2025-08-15 21:15:15.45
3a48e356-e855-4506-9660-b058592fc1a6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	ed7b4704-9872-4e7f-a799-2a08a4694241	2c12ab83-b7b1-47f6-88b8-d25381c7c213	ACTIVE	2025-05-21	2025-10-13	1200.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:15.63	2025-08-15 21:15:15.63
df7b65ed-7f73-4071-ac68-faa8ce4a2174	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	f9e935d8-2de6-44fc-a2d4-d7f9a58a4224	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2024-11-27	2025-11-11	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:15.813	2025-08-15 21:15:15.813
6bdaac5a-760c-4b22-8ade-ae5bd9067b68	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	0f3f75a5-257a-4ecc-bd35-d9ce44e44510	2c12ab83-b7b1-47f6-88b8-d25381c7c213	EXPIRED	2025-01-24	2025-07-09	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:16.005	2025-08-15 21:15:16.005
5fc13ba0-ba44-41ee-a65d-74a52d4942aa	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	a782550d-3c55-4360-b04b-592f7fcb7251	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	EXPIRED	2024-10-05	2025-07-11	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:16.187	2025-08-15 21:15:16.187
65ef03ec-1161-4a2c-b898-c740139dcd8b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	a44fd54f-c58d-447f-ada5-d5550dfac49a	fd4a9391-7639-43a1-a6ae-e8516c73efd0	EXPIRED	2025-02-19	2025-07-24	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:16.375	2025-08-15 21:15:16.375
0f143239-860f-46b8-9fb3-b9f093c6f67a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	4f8cb99f-4027-4cbe-94c1-203953439e37	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2024-10-17	2025-10-09	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:16.581	2025-08-15 21:15:16.581
6861c0fd-85c0-42a6-9e3e-564687d0ff94	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	0cf489e8-4901-48b5-95a3-b865c9ec4e7d	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2025-06-21	2025-09-15	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:16.763	2025-08-15 21:15:16.763
7310b993-1853-45b9-b76c-c148def8e9c5	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	b64c164b-200f-4fa2-b3ef-0fb8f1a2885b	2c12ab83-b7b1-47f6-88b8-d25381c7c213	ACTIVE	2024-08-27	2025-09-18	1200.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:16.94	2025-08-15 21:15:16.94
e4d5ab2d-b28d-4ae6-94ad-80cd79cdec31	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	9e8006c1-435d-4233-a1fa-b6a354370b7a	6041c766-6626-4b46-8a0c-1d29b464e6d3	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2025-02-10	2025-08-18	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:17.315	2025-08-15 21:15:17.315
49df9d1a-f900-4850-8449-0dc07510d23e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	b29d347c-9ead-4449-ad79-3c6e87c24acc	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-04-17	2025-09-19	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:18.042	2025-08-15 21:15:18.042
33b2d06d-f667-4784-9ce9-b6287f1e8399	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	6ff363cd-6c14-46f1-ae83-349ee293ea20	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2025-01-25	2025-10-06	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:18.222	2025-08-15 21:15:18.222
c2798ce6-e562-4efe-add4-798813c679ea	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	294a9115-ad8c-4b7a-aaaa-bbe6ac9eb834	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2024-11-24	2025-08-21	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:18.583	2025-08-15 21:15:18.583
bd259dac-edee-412d-82fe-3831312b3d69	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	235d201b-9a65-4f56-be06-fb7707e7e26b	8af0b42f-e67f-41e1-a044-371f4a000f65	ACTIVE	2024-08-25	2025-10-17	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:18.764	2025-08-15 21:15:18.764
e8fb77d3-131b-428e-8521-aefa96f9527f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	76a2b8f3-4285-488f-8802-443a7795c971	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2024-08-19	2025-08-17	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:18.947	2025-08-15 21:15:18.947
f158c7f8-6bac-425c-a440-fd74ed1d6e15	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	795e3897-f051-4f99-bd3e-144e3eb75a2d	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	ACTIVE	2024-11-10	2025-10-02	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:19.129	2025-08-15 21:15:19.129
22ce1519-f050-4aea-8149-833d5e4dddbc	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	0a3ff09b-fb4f-48aa-834e-1f3242c71191	bd583d1f-63ac-4db0-ae23-e987b97c4b01	ACTIVE	2025-05-20	2025-11-04	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:19.313	2025-08-15 21:15:19.313
5ada662f-ed88-4e05-b615-d04ec408f046	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	bdfb52b4-4099-43b6-a5ad-e105d73ee9cd	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2024-10-04	2025-10-09	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:19.496	2025-08-15 21:15:19.496
3a4f1729-1c35-4065-9962-4002e823cc7b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	838c2609-41f0-4370-95f0-706698b35c2c	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2025-04-22	2025-11-23	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:19.67	2025-08-15 21:15:19.67
53e2c639-337c-4e8a-8747-5cef64d0ed9d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	9dc6450b-37bd-489a-8053-ce0c673cf484	fd4a9391-7639-43a1-a6ae-e8516c73efd0	ACTIVE	2024-11-07	2025-12-12	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:19.843	2025-08-15 21:15:19.843
573229f0-2ec6-49f7-9f44-c25d15f7c3b6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	baafbac5-b320-4a5b-b113-4b332d15a351	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-07-15	2025-08-17	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:20.016	2025-08-15 21:15:20.016
95290e62-d032-45a1-ab19-63025c3efaf0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	9339893c-3a56-4e48-8613-8fd3962ed2da	2c12ab83-b7b1-47f6-88b8-d25381c7c213	EXPIRED	2025-05-14	2025-08-06	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:20.19	2025-08-15 21:15:20.19
58a518b6-3631-4850-b45c-54fa1434453f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	a6c57000-0c2c-4d31-83e6-e0244c497009	8af0b42f-e67f-41e1-a044-371f4a000f65	ACTIVE	2025-03-01	2025-11-22	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:20.375	2025-08-15 21:15:20.375
0b1943c9-ba37-4931-b95d-6ea448340d26	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	bda45883-e863-4814-bdcf-9554683c43b2	2c12ab83-b7b1-47f6-88b8-d25381c7c213	ACTIVE	2025-08-14	2025-08-17	1200.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:20.565	2025-08-15 21:15:20.565
9ce05823-3f44-4e6d-a8f1-5afc61266db2	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	acfee35d-14de-4888-97f5-48d49726ba76	91c3108c-aa48-4b84-9bf3-d284889d4fa5	57f58dee-30ac-4d9f-8533-5e31d5607377	EXPIRED	2024-12-29	2025-07-31	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:20.758	2025-08-15 21:15:20.758
22bec008-9c7c-4ab5-b6a6-98005a888ab4	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	6bf33357-06b2-4d2c-945b-8891389fb68b	efee1cce-5789-4980-ae15-563a28dc69cd	EXPIRED	2024-09-22	2025-08-11	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:22.055	2025-08-15 21:15:22.055
52b76e75-2055-4cce-b23b-05f511ab6674	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	8a02baab-c306-429e-b620-077e917badd0	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2024-11-01	2025-11-09	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:22.24	2025-08-15 21:15:22.24
8470df53-2d05-4c81-ab64-4283a6173dfd	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	dfd3b910-7871-4e6e-a839-4590947b517d	0455aa29-7f57-4666-a17f-10028c21a0a2	ACTIVE	2024-10-02	2025-08-17	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:22.602	2025-08-15 21:15:22.602
8e421267-c67b-473e-8f6b-6a27c2bfbf61	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	c74961d3-ba1c-4ee5-aeb2-44877ef69675	0455aa29-7f57-4666-a17f-10028c21a0a2	ACTIVE	2025-07-23	2025-08-18	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:22.971	2025-08-15 21:15:22.971
9227705e-6140-4db9-be5a-fbc151e8bbc4	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	c888a561-f343-4903-8403-fa3e344700bf	0455aa29-7f57-4666-a17f-10028c21a0a2	EXPIRED	2025-03-20	2025-07-19	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:23.16	2025-08-15 21:15:23.16
3c156c6f-7801-4519-a0b3-b19fa8b11d10	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	4c76499d-0a6e-483b-9abc-717b4719e48b	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2025-06-24	2025-12-12	1200.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:23.338	2025-08-15 21:15:23.338
1561f290-e58f-41f1-93ae-03f5dd6d3a71	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	3a1b2349-5c38-410d-afe2-e00841274936	b13d327c-39b8-4629-843c-26946f367422	EXPIRED	2025-04-22	2025-06-01	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:23.53	2025-08-15 21:15:23.53
7c4f5055-6cbf-4fc0-9641-ff88f2cc1b6d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	4053317b-c36e-4cfa-afc3-380077c8eeb1	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	ACTIVE	2025-03-03	2025-08-17	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:23.726	2025-08-15 21:15:23.726
b068faa3-fce4-425e-80f2-688c380f3ddb	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	e4624fb5-1793-4b5d-806e-491ebeec1583	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2024-09-16	2025-10-24	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:23.917	2025-08-15 21:15:23.917
d77ea57b-9fbb-43b2-afd9-21c2aed35b92	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	b5712765-0812-49e4-a8f5-daa61a3f5791	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2024-10-01	2025-08-15	2500.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:24.173	2025-08-15 21:15:24.173
550d948c-fb88-488a-85b2-5e4f4bc3a27e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	3d65100b-25ab-46fd-b4a2-f1d4df263ca8	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2024-11-07	2025-10-18	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:24.412	2025-08-15 21:15:24.412
a4dd599e-bffa-47d8-b8b6-918b13ac799a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	bd53a564-62dc-4e71-b287-fbc4aa95ff45	b13d327c-39b8-4629-843c-26946f367422	ACTIVE	2025-05-05	2025-08-20	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:24.625	2025-08-15 21:15:24.625
fee21feb-a9de-49f7-9305-7a9b1f5ae6d5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	e12a9403-9e52-4bb6-8b0d-c2c80498686c	0455aa29-7f57-4666-a17f-10028c21a0a2	EXPIRED	2025-07-04	2025-07-25	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:24.809	2025-08-15 21:15:24.809
6245b2a6-6110-4362-a392-ac72185d7475	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	fddd6a86-ad1c-46a9-ad42-a14899bc45f0	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	ACTIVE	2025-01-23	2025-08-21	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:24.995	2025-08-15 21:15:24.995
5eef0312-ada8-4518-8f9f-983e2e4d3b24	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	16b625c7-5530-4ceb-8c8e-91d66a653f52	0455aa29-7f57-4666-a17f-10028c21a0a2	EXPIRED	2025-01-07	2025-07-15	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:25.177	2025-08-15 21:15:25.177
b170ec14-cee6-4dc1-ba6f-a9ed7b92bf22	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	5defd169-d762-49f3-bb8d-0efdceed53ac	8650f1eb-50d1-4027-84da-e7ee7e76aacb	EXPIRED	2025-07-30	2025-05-21	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:25.359	2025-08-15 21:15:25.359
42257f85-56a1-41d2-b2d1-83a9eb01b86c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	e54b9b90-9405-4549-8c20-ead4b2fc191e	4597f4c8-2e9f-4b7b-8e5c-565df03c6c3c	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2024-10-25	2025-09-23	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:25.545	2025-08-15 21:15:25.545
c440b757-ae4b-41cd-8b5f-5685193a379f	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	5ea148ca-2a67-4b8d-91d3-f1de3d6bbd7a	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2024-12-29	2025-11-17	2500.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:26.263	2025-08-15 21:15:26.263
75e04ea8-8adf-4778-8c5c-5884d751ccfd	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	ee3f7e0d-c0d0-4669-a68a-48be3aaad08b	b13d327c-39b8-4629-843c-26946f367422	ACTIVE	2025-05-21	2025-08-15	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:26.435	2025-08-15 21:15:26.435
e33a4569-2d2e-4b46-bb6e-485d835a7427	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	7c7b5744-de44-4444-9f89-744ac7610479	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	EXPIRED	2025-02-06	2025-05-25	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:26.621	2025-08-15 21:15:26.621
c3148a02-65f4-4b05-87f3-0ba429d190fc	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	859d77d6-2632-4669-8bc2-85a36e21600d	b13d327c-39b8-4629-843c-26946f367422	EXPIRED	2025-03-29	2025-06-21	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:26.803	2025-08-15 21:15:26.803
e4abaa77-0df3-4f7d-b71c-7dbd89e33f61	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	10c7b2fe-820b-474a-a7ed-6b2224a60e52	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2025-03-06	2025-11-21	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:26.987	2025-08-15 21:15:26.987
76865773-a51e-4c32-acdf-736dc1b790d0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	50730399-c746-4588-9db6-1874648c9b0e	8650f1eb-50d1-4027-84da-e7ee7e76aacb	EXPIRED	2025-07-17	2025-07-09	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:27.17	2025-08-15 21:15:27.17
562d09d7-3363-446e-82b9-c2e5d713fbfb	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	41f2b890-95b7-4c88-a143-459fcbbab863	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2024-11-12	2025-08-19	1200.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:27.352	2025-08-15 21:15:27.352
37e7d9e9-710a-489e-8c59-58d6b96749a0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	5e64e217-26b5-4748-b30a-43d59f3ce3b5	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	ACTIVE	2025-06-04	2025-08-18	12000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:27.539	2025-08-15 21:15:27.539
bb00f981-d007-4c4e-b00c-951c71e48f72	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	c072b241-12dd-4215-819d-7e22ba74a8c6	0455aa29-7f57-4666-a17f-10028c21a0a2	ACTIVE	2025-01-19	2025-10-21	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:27.912	2025-08-15 21:15:27.912
28b28c6d-d1b8-4653-ac0a-cc4de4d646a1	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	0724e47d-dcf1-4de8-b832-48dd78c8ba58	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	EXPIRED	2025-04-26	2025-07-29	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:28.108	2025-08-15 21:15:28.108
f276224c-fbef-4328-8ca0-9029a17f4536	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	6232bf09-1929-46e9-86dd-73fee1e51308	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	EXPIRED	2025-03-13	2025-07-25	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:28.295	2025-08-15 21:15:28.295
94766310-b3b6-4733-a1dd-b962fff8778c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	48891e1a-6049-4ed8-88a4-1315969f47bf	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	ACTIVE	2024-12-09	2025-08-21	800.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:28.477	2025-08-15 21:15:28.477
7432ae6b-0c26-4a5c-a17a-9bc558d67098	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	eceffe21-0f38-4e3b-a22a-c7c2ae268c7f	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	EXPIRED	2025-04-14	2025-06-14	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:28.659	2025-08-15 21:15:28.659
daf33e8b-95ce-43e9-8b2f-8320f8af7588	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	9ef87d13-3400-4719-a5c2-3e132410eeef	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	ACTIVE	2024-11-20	2025-08-19	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:28.841	2025-08-15 21:15:28.841
12ac0ed3-b64a-4fad-a5e0-974df3620e60	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	52da20cd-a142-44f0-899e-58fc55cc66ff	0455aa29-7f57-4666-a17f-10028c21a0a2	EXPIRED	2025-01-27	2025-08-05	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:29.023	2025-08-15 21:15:29.023
d48a1d80-95ad-4f02-8142-3786902e3793	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	698bb930-e4eb-46e1-85d6-0b1b0ba5761e	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	ACTIVE	2024-11-23	2025-08-17	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:29.205	2025-08-15 21:15:29.205
ec63c6c6-0633-432f-898c-2072a5c4317a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	06af4d42-3e87-4dad-aa28-ee1b7b3897c9	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	ACTIVE	2025-06-04	2025-08-19	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:29.387	2025-08-15 21:15:29.387
cc239afd-a496-4082-a3c7-6c894b570285	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	48d488c3-0fcd-4b71-809c-191bbc258e0f	0455aa29-7f57-4666-a17f-10028c21a0a2	ACTIVE	2025-06-13	2025-10-03	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:29.571	2025-08-15 21:15:29.571
5f8ae008-d555-4604-b55f-f1bb54bc6131	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	cf9b15ae-9323-4ea9-a3e8-e8d9a3218abe	0455aa29-7f57-4666-a17f-10028c21a0a2	ACTIVE	2025-01-02	2025-11-15	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:29.753	2025-08-15 21:15:29.753
24545e08-d0f0-4016-9200-ebe32ef4cf10	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	1b2b2615-4838-4bac-ab4b-57c279a62b05	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	ACTIVE	2025-06-25	2025-10-10	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:29.937	2025-08-15 21:15:29.937
3d378871-edce-4b9b-a0d6-333bf6771c91	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	1896ee49-7e84-408a-a955-8ff335544891	8650f1eb-50d1-4027-84da-e7ee7e76aacb	EXPIRED	2025-03-02	2025-06-28	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:30.12	2025-08-15 21:15:30.12
653efe38-6d89-4fd8-9627-2d8df7d41ec5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	3d11dce9-9336-413d-931f-f82ee9fecc8a	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	EXPIRED	2025-01-08	2025-06-06	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:30.305	2025-08-15 21:15:30.305
efddfae0-e8a3-404f-b5e6-87a706aa2b79	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	416ed71f-e7f1-4f6b-9691-924f830d6904	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2025-07-24	2025-08-17	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:30.486	2025-08-15 21:15:30.486
90bc5208-b3f4-417f-9def-c6824a1c0b26	d9e2fdf8-6b16-4340-97ec-5eace22acc57	3f1b2054-26d7-4895-84bb-0322ec7042b0	f82a06f6-e805-461b-94a2-c2ce6a9e9c91	0455aa29-7f57-4666-a17f-10028c21a0a2	EXPIRED	2025-07-20	2025-07-12	20000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:30.671	2025-08-15 21:15:30.671
fcc7fe69-e886-4b59-ade8-be1346ec3a63	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	541a91d9-0241-41f9-9bed-a7cab725a7d7	b13d327c-39b8-4629-843c-26946f367422	EXPIRED	2025-06-10	2025-07-08	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:31.376	2025-08-15 21:15:31.376
d3797b09-91e0-47ea-9e4a-4fdaaf348502	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	bb4e114c-2d7b-476a-bbf3-67c50896fb2e	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	EXPIRED	2025-08-01	2025-08-08	800.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:31.558	2025-08-15 21:15:31.558
1cf26a96-3abd-4904-8ad8-decd611b74e2	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	5100d597-560d-489d-af2d-235076f30841	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	ACTIVE	2024-11-05	2025-08-16	800.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:31.74	2025-08-15 21:15:31.74
be8d1a74-d82b-481d-a3e1-29bb1a391119	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	e915fb04-b580-40ae-8a35-7eb07949c507	8650f1eb-50d1-4027-84da-e7ee7e76aacb	EXPIRED	2024-09-20	2025-06-16	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:31.923	2025-08-15 21:15:31.923
4aeb728f-1cad-4dfc-897b-b2368b314578	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	bbe614ae-2383-4f72-90af-e4f59722eb36	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2025-06-14	2025-09-30	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:32.112	2025-08-15 21:15:32.112
24e807d6-dd60-45ed-906a-2181f1319399	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	4fe8a88d-32f5-47d9-bef2-73f69b5d7491	efee1cce-5789-4980-ae15-563a28dc69cd	ACTIVE	2025-07-15	2025-12-12	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:32.294	2025-08-15 21:15:32.294
cab815c8-cb0c-4925-92f6-1129309436c6	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	eeae7ae6-a1ff-4ace-aa80-6ff1065add60	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2024-10-19	2025-11-24	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:32.476	2025-08-15 21:15:32.476
03529593-37ee-403d-a00d-350e1be670ed	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	c5b213ab-6caf-4b7c-ab4c-909ea92117fe	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	EXPIRED	2025-01-31	2025-07-30	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:32.661	2025-08-15 21:15:32.661
d2e473b9-0583-48e9-a7cd-b793234b0879	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	34773a75-10d7-4371-a9af-40cfaccb78dc	0455aa29-7f57-4666-a17f-10028c21a0a2	EXPIRED	2025-07-23	2025-06-14	20000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:32.851	2025-08-15 21:15:32.851
5e9879d1-ab13-4a60-8bc9-a4a62cc56c31	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	a541f0b2-43c6-471a-823c-7ed166b3095c	b13d327c-39b8-4629-843c-26946f367422	ACTIVE	2025-04-24	2025-08-17	150.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:33.058	2025-08-15 21:15:33.058
820f0e0c-a45f-4fb5-8ac0-311118789d8c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	67214f3c-db70-4264-8958-d659939a2d4c	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2025-03-20	2025-09-26	2500.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:33.256	2025-08-15 21:15:33.256
cb0757f9-9734-4c09-8d58-4c0401a64a31	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	0d76c3a8-b881-4273-829e-eca4280cf0cb	8650f1eb-50d1-4027-84da-e7ee7e76aacb	EXPIRED	2025-02-23	2025-06-02	2500.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:33.442	2025-08-15 21:15:33.442
47ddd580-e60f-4215-bd91-3ea5f667cd4b	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	0dd97c34-d21b-4d40-9a2d-44bb5ca372b1	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	ACTIVE	2024-10-19	2025-10-17	12000.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:33.659	2025-08-15 21:15:33.659
2954c855-67a9-4a88-bdb3-84e6d0a403e2	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	9bf15681-7144-4a2b-bdf7-cea7da068f47	b13d327c-39b8-4629-843c-26946f367422	ACTIVE	2025-05-14	2025-10-22	150.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:33.857	2025-08-15 21:15:33.857
64570e77-c890-44ba-ba0d-80255cee1ec7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	88951605-b502-4327-b8b7-8f0574dc7141	8650f1eb-50d1-4027-84da-e7ee7e76aacb	ACTIVE	2024-12-28	2025-08-17	2500.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:34.061	2025-08-15 21:15:34.061
f2410288-543b-4523-9eb1-00e68ec33bb4	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	d3e8af3e-565b-4730-b4f1-8aa39dd4c4ce	efee1cce-5789-4980-ae15-563a28dc69cd	EXPIRED	2025-07-23	2025-05-25	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:34.266	2025-08-15 21:15:34.266
01264a9f-f04f-46b8-866f-7b56b497d30f	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	87f2519b-93a2-4723-9bed-5ece8cba43c9	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	EXPIRED	2025-04-09	2025-07-17	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:34.476	2025-08-15 21:15:34.476
a2c8183a-faba-4283-9a8e-f7015b4bd805	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	7ff92cd0-7706-4c5c-a825-469accf3867a	0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	EXPIRED	2024-11-19	2025-07-20	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:34.681	2025-08-15 21:15:34.681
7507ee5c-3351-4dc8-8861-d32514eebd12	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	cbf3fb80-71db-4137-96ae-690e6850d123	efee1cce-5789-4980-ae15-563a28dc69cd	EXPIRED	2024-09-26	2025-07-07	1200.00	PHP	\N	\N	\N	\N	t	\N	2025-08-15 21:15:34.886	2025-08-15 21:15:34.886
ff274d05-fe54-43a7-a70d-f39adf0f3004	d9e2fdf8-6b16-4340-97ec-5eace22acc57	b23e99db-5420-49c2-8781-bf5b4022405a	d231ee48-9bdf-4715-ae5b-438a67e59930	bd3ac1d9-0118-40a3-a94a-7ebc337f2171	ACTIVE	2025-03-27	2025-08-20	800.00	PHP	\N	\N	\N	\N	f	\N	2025-08-15 21:15:35.084	2025-08-15 21:15:35.084
35df7c4e-03a2-42ec-a794-d24251c75327	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	\N	f82d6622-da5d-4c7a-b471-5d586e6d58f9	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	CANCELLED	2025-08-16	2025-09-15	800.00	PHP	\N	2025-08-16 03:37:59.762	MEMBER_REQUEST	Testing cancellation functionality	f	\N	2025-08-16 03:37:50.344	2025-08-16 03:37:59.763
aa70db99-46f8-427c-a810-1876ab9e022a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	\N	f8522206-fe3f-4430-90ec-2227a7f74b04	55fa2a76-ccfc-4aea-b69b-26a38bff4f46	CANCELLED	2025-08-16	2025-09-15	800.00	PHP	\N	2025-08-16 05:43:19.973	POLICY_VIOLATION		t	\N	2025-08-16 05:41:45.173	2025-08-16 05:43:19.974
22c2c2fe-7874-4627-9bcf-f7f5ba66e8ea	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	\N	2875895a-da05-4fe7-bec3-2d3a1c004a4f	2c12ab83-b7b1-47f6-88b8-d25381c7c213	CANCELLED	2025-08-16	2025-09-15	1200.00	PHP	\N	2025-08-16 05:52:18.586	Member request		t	\N	2025-08-16 03:37:34.534	2025-08-16 05:52:18.587
fb49aa6b-4630-4d47-b799-8348a78648a4	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	\N	cd266fd9-21b6-47cd-a42c-080a1ced11ee	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-08-16	2026-08-16	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-16 06:10:17.293	2025-08-16 06:10:34.2
bbfd45eb-0a41-4bca-95de-959696a7513f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	\N	25a78382-a9a5-48b4-9cb0-e5cb15331193	57f58dee-30ac-4d9f-8533-5e31d5607377	ACTIVE	2025-08-16	2026-08-16	12000.00	PHP	\N	\N	\N	\N	t	\N	2025-08-16 06:19:14.361	2025-08-16 06:24:14.639
\.


--
-- Data for Name: MemberAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MemberAuditLog" (id, "memberId", action, reason, notes, "previousState", "newState", "performedBy", "performedAt", metadata, "createdAt") FROM stdin;
4c4c10b1-27a4-4ead-8ccf-8b8dab9f9e27	f8522206-fe3f-4430-90ec-2227a7f74b04	ACCOUNT_DEACTIVATED	POLICY_VIOLATION		ACTIVE	CANCELLED	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:43:00.375	{"subscriptionId": "aa70db99-46f8-427c-a810-1876ab9e022a", "subscriptionEndDate": "2025-09-15T00:00:00.000Z"}	2025-08-16 05:43:00.375
0bbb7c7c-7dfd-43d9-922e-c77e564dc0c3	f8522206-fe3f-4430-90ec-2227a7f74b04	ACCOUNT_ACTIVATED	Payment received		CANCELLED	ACTIVE	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:43:15.109	{"subscriptionId": "aa70db99-46f8-427c-a810-1876ab9e022a", "subscriptionStatus": "CANCELLED"}	2025-08-16 05:43:15.109
09c5e130-3492-41ea-9233-18c4e9dd9351	f8522206-fe3f-4430-90ec-2227a7f74b04	ACCOUNT_DEACTIVATED	POLICY_VIOLATION		ACTIVE	CANCELLED	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:43:19.989	{"subscriptionId": "aa70db99-46f8-427c-a810-1876ab9e022a", "subscriptionEndDate": "2025-09-15T00:00:00.000Z"}	2025-08-16 05:43:19.989
c6bc2a75-aa5c-4c7f-92f2-1c689705f581	2875895a-da05-4fe7-bec3-2d3a1c004a4f	ACCOUNT_DEACTIVATED	POLICY_VIOLATION		ACTIVE	CANCELLED	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:52:04.901	{"subscriptionId": "22c2c2fe-7874-4627-9bcf-f7f5ba66e8ea", "subscriptionEndDate": "2025-09-15T00:00:00.000Z"}	2025-08-16 05:52:04.901
b36c814d-75af-41ab-812d-546ac13e931a	2875895a-da05-4fe7-bec3-2d3a1c004a4f	ACCOUNT_ACTIVATED	Payment received		CANCELLED	ACTIVE	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:52:10.788	{"subscriptionId": "22c2c2fe-7874-4627-9bcf-f7f5ba66e8ea", "subscriptionStatus": "CANCELLED"}	2025-08-16 05:52:10.788
13b46188-d213-454a-873b-c8fe4da8c655	2875895a-da05-4fe7-bec3-2d3a1c004a4f	ACCOUNT_DEACTIVATED	Member request		ACTIVE	CANCELLED	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 05:52:18.603	{"subscriptionId": "22c2c2fe-7874-4627-9bcf-f7f5ba66e8ea", "subscriptionEndDate": "2025-09-15T00:00:00.000Z"}	2025-08-16 05:52:18.603
fe90ef7f-6126-46b1-bd11-342f5f36a9e9	cd266fd9-21b6-47cd-a42c-080a1ced11ee	ACCOUNT_DEACTIVATED	MEMBER_REQUEST		ACTIVE	CANCELLED	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:10:29.518	{"subscriptionId": "fb49aa6b-4630-4d47-b799-8348a78648a4", "subscriptionEndDate": "2026-08-16T00:00:00.000Z"}	2025-08-16 06:10:29.518
54142dfe-8a61-46dc-b524-f43abf94d159	cd266fd9-21b6-47cd-a42c-080a1ced11ee	ACCOUNT_ACTIVATED	Member request		CANCELLED	ACTIVE	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:10:34.206	{"subscriptionId": "fb49aa6b-4630-4d47-b799-8348a78648a4", "subscriptionStatus": "CANCELLED"}	2025-08-16 06:10:34.206
a45222f2-59ca-4f8f-b14b-53e8077712ca	cd266fd9-21b6-47cd-a42c-080a1ced11ee	ACCOUNT_RESTORED	Payment received	Member account restored from deleted state	DELETED	ACTIVE	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:11:26.097	{"restoredAt": "2025-08-16T06:11:26.096Z"}	2025-08-16 06:11:26.097
0d1155a1-fc6f-4a1a-a6cc-cb968ab7d2d2	25a78382-a9a5-48b4-9cb0-e5cb15331193	ACCOUNT_DEACTIVATED	POLICY_VIOLATION		ACTIVE	CANCELLED	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:24:09.984	{"subscriptionId": "bbfd45eb-0a41-4bca-95de-959696a7513f", "subscriptionEndDate": "2026-08-16T00:00:00.000Z"}	2025-08-16 06:24:09.984
adcb0df8-6a55-4fcc-933c-385e9f4766af	25a78382-a9a5-48b4-9cb0-e5cb15331193	ACCOUNT_ACTIVATED	System error resolved		CANCELLED	ACTIVE	6445aaca-684e-4ba9-bf07-d83690177f9b	2025-08-16 06:24:14.643	{"subscriptionId": "bbfd45eb-0a41-4bca-95de-959696a7513f", "subscriptionStatus": "CANCELLED"}	2025-08-16 06:24:14.643
\.


--
-- Data for Name: MembershipPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipPlan" (id, "tenantId", name, description, price, duration, type, benefits, "isActive", "createdAt", "updatedAt") FROM stdin;
fd4a9391-7639-43a1-a6ae-e8516c73efd0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Day Pass	Single day gym access	150.000000000000000000000000000000	1	DAY_PASS	"[\\"Full gym access for 1 day\\",\\"Use of all equipment\\",\\"Locker access\\"]"	t	2025-08-15 21:15:08.69	2025-08-15 21:15:08.69
2c12ab83-b7b1-47f6-88b8-d25381c7c213	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Basic Monthly	Standard monthly membership	1200.000000000000000000000000000000	30	MONTHLY	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"Locker access\\",\\"Fitness assessment\\"]"	t	2025-08-15 21:15:08.694	2025-08-15 21:15:08.694
8af0b42f-e67f-41e1-a044-371f4a000f65	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Premium Monthly	Premium monthly membership with PT sessions	2500.000000000000000000000000000000	30	MONTHLY	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"2 Personal Training sessions\\",\\"Nutrition consultation\\",\\"Towel service\\",\\"Guest passes (2 per month)\\"]"	t	2025-08-15 21:15:08.697	2025-08-15 21:15:08.697
57f58dee-30ac-4d9f-8533-5e31d5607377	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Annual Basic	Basic annual membership - save 2 months!	12000.000000000000000000000000000000	365	ANNUAL	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"Locker access\\",\\"Quarterly fitness assessment\\",\\"2 months free!\\"]"	t	2025-08-15 21:15:08.7	2025-08-15 21:15:08.7
55fa2a76-ccfc-4aea-b69b-26a38bff4f46	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Student Monthly	Discounted membership for students	800.000000000000000000000000000000	30	STUDENT	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"Student discount\\",\\"Study area access\\"]"	t	2025-08-15 21:15:08.703	2025-08-15 21:15:08.703
bd583d1f-63ac-4db0-ae23-e987b97c4b01	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Corporate Package	Special rates for corporate clients	20000.000000000000000000000000000000	30	CORPORATE	"[\\"Up to 20 employees\\",\\"Corporate wellness programs\\",\\"Team building sessions\\",\\"Health screenings\\",\\"Flexible scheduling\\"]"	t	2025-08-15 21:15:08.706	2025-08-15 21:15:08.706
b13d327c-39b8-4629-843c-26946f367422	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Day Pass	Single day gym access	150.000000000000000000000000000000	1	DAY_PASS	"[\\"Full gym access for 1 day\\",\\"Use of all equipment\\",\\"Locker access\\"]"	t	2025-08-15 21:15:20.947	2025-08-15 21:15:20.947
efee1cce-5789-4980-ae15-563a28dc69cd	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Basic Monthly	Standard monthly membership	1200.000000000000000000000000000000	30	MONTHLY	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"Locker access\\",\\"Fitness assessment\\"]"	t	2025-08-15 21:15:20.95	2025-08-15 21:15:20.95
8650f1eb-50d1-4027-84da-e7ee7e76aacb	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Premium Monthly	Premium monthly membership with PT sessions	2500.000000000000000000000000000000	30	MONTHLY	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"2 Personal Training sessions\\",\\"Nutrition consultation\\",\\"Towel service\\",\\"Guest passes (2 per month)\\"]"	t	2025-08-15 21:15:20.953	2025-08-15 21:15:20.953
0d8c65f3-1ddd-4a80-8fd6-26a9a0400bf6	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Annual Basic	Basic annual membership - save 2 months!	12000.000000000000000000000000000000	365	ANNUAL	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"Locker access\\",\\"Quarterly fitness assessment\\",\\"2 months free!\\"]"	t	2025-08-15 21:15:20.956	2025-08-15 21:15:20.956
bd3ac1d9-0118-40a3-a94a-7ebc337f2171	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Student Monthly	Discounted membership for students	800.000000000000000000000000000000	30	STUDENT	"[\\"Unlimited gym access\\",\\"Group classes included\\",\\"Student discount\\",\\"Study area access\\"]"	t	2025-08-15 21:15:20.959	2025-08-15 21:15:20.959
0455aa29-7f57-4666-a17f-10028c21a0a2	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Corporate Package	Special rates for corporate clients	20000.000000000000000000000000000000	30	CORPORATE	"[\\"Up to 20 employees\\",\\"Corporate wellness programs\\",\\"Team building sessions\\",\\"Health screenings\\",\\"Flexible scheduling\\"]"	t	2025-08-15 21:15:20.962	2025-08-15 21:15:20.962
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "subscriptionId", amount, "paymentDate", status, "paymentMethod", "transactionId", "receiptUrl", "createdAt", "updatedAt") FROM stdin;
95aea62a-e556-43d0-9df8-19ffd35f7e84	40a41a1f-4133-4b4c-977d-c2559231807c	1500.000000000000000000000000000000	2025-08-15 21:15:08.714	SUCCESSFUL	CARD	txn_1755292508719_fv6mh5cf8	\N	2025-08-15 21:15:08.72	2025-08-15 21:15:08.72
8d8af667-1958-4469-b6fd-f636caecae2b	ee2ccf18-7681-4823-8ffd-495e78b5c56f	1500.000000000000000000000000000000	2025-08-15 21:15:20.97	SUCCESSFUL	CARD	txn_1755292520973_xxj4a1tuo	\N	2025-08-15 21:15:20.974	2025-08-15 21:15:20.974
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Plan" (id, name, price, "billingCycle", description, "isActive") FROM stdin;
1db98c89-cad2-41f2-9a79-04c00993c906	Free Trial	0.000000000000000000000000000000	TRIAL	4 weeks free trial - full access to all features	t
14b5d5a4-702c-495c-a1c6-21235dee1d75	Monthly Pro	1500.000000000000000000000000000000	MONTHLY	Monthly subscription with full gym management features	t
b2bd8536-a23f-4ec2-97e1-e5c7df0f4a7f	Annual Pro	15000.000000000000000000000000000000	YEARLY	Annual subscription - save 2 months! Full gym management features	t
\.


--
-- Data for Name: PlatformRevenue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformRevenue" (id, "tenantId", "tenantName", "businessType", "revenueType", amount, currency, "billingPeriodStart", "billingPeriodEnd", "paymentStatus", "paymentDate", "paymentMethod", "paymentReference", "sourceTransactionId", "subscriptionPlanId", description, notes, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SaasSubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SaasSubscription" (id, "businessUnitId", "planName", status, "startDate", "endDate", "trialEndsAt", "monthlyPrice", currency, "paymentMethod", "paymentReference", "lastPaymentDate", "nextBillingDate", "autoRenew", "cancelledAt", "cancellationReason", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subscription" (id, "branchId", "planId", "startDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
40a41a1f-4133-4b4c-977d-c2559231807c	552c8390-97a6-4866-bc39-1f7fb1c21344	14b5d5a4-702c-495c-a1c6-21235dee1d75	2025-08-15 21:15:08.714	2025-09-15 21:15:08.714	ACTIVE	2025-08-15 21:15:08.715	2025-08-15 21:15:08.715
3fb18378-2900-4428-a34c-d738b2061692	9e8006c1-435d-4233-a1fa-b6a354370b7a	1db98c89-cad2-41f2-9a79-04c00993c906	2025-08-15 21:15:13.304	2025-09-12 21:15:13.304	ACTIVE	2025-08-15 21:15:13.304	2025-08-15 21:15:13.304
b853d67a-cf64-45f2-802e-5a49ba5dd652	acfee35d-14de-4888-97f5-48d49726ba76	1db98c89-cad2-41f2-9a79-04c00993c906	2025-08-15 21:15:17.327	2025-09-12 21:15:17.327	ACTIVE	2025-08-15 21:15:17.327	2025-08-15 21:15:17.327
ee2ccf18-7681-4823-8ffd-495e78b5c56f	e54b9b90-9405-4549-8c20-ead4b2fc191e	14b5d5a4-702c-495c-a1c6-21235dee1d75	2025-08-15 21:15:20.97	2025-09-15 21:15:20.97	ACTIVE	2025-08-15 21:15:20.971	2025-08-15 21:15:20.971
180ab6e7-609a-4526-8e42-c69e7ddccd4f	3f1b2054-26d7-4895-84bb-0322ec7042b0	1db98c89-cad2-41f2-9a79-04c00993c906	2025-08-15 21:15:25.555	2025-09-12 21:15:25.555	ACTIVE	2025-08-15 21:15:25.555	2025-08-15 21:15:25.555
54a3e731-4669-47a5-be1b-3d80123ec2af	b23e99db-5420-49c2-8781-bf5b4022405a	1db98c89-cad2-41f2-9a79-04c00993c906	2025-08-15 21:15:30.682	2025-09-12 21:15:30.682	ACTIVE	2025-08-15 21:15:30.683	2025-08-15 21:15:30.683
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tenant" (id, name, slug, category, "logoUrl", address, "phoneNumber", email, "primaryColor", "secondaryColor", "websiteUrl", description, "createdAt", "updatedAt", "freeBranchOverride", "paidModeEnabled", "freeUnitsLimit", "trialDurationDays") FROM stdin;
111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Muscle Mania	muscle-mania	GYM	\N	789 Muscle Road, Cebu City	+63 32 987 6543	info@muscle-mania.com	\N	\N	\N	\N	2025-08-15 21:15:08.518	2025-08-15 21:15:08.518	0	f	1	28
d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chakara	chakara	GYM	\N	123 Fitness Street, Metro Manila	+63 2 123 4567	contact@chakara.com	\N	\N	\N	\N	2025-08-15 21:15:20.768	2025-08-15 21:15:20.768	0	f	1	28
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "tenantId", "firstName", "lastName", email, "phoneNumber", role, "isActive", notes, "photoUrl", "businessData", "deletedAt", "deletedBy", "createdAt", "updatedAt", name, password) FROM stdin;
6e789fac-89ac-431d-9b15-23c48601c69a	\N	Super	Admin	admin@creatives-saas.com	\N	SUPER_ADMIN	t	\N	\N	\N	\N	\N	2025-08-15 21:15:08.491	2025-08-15 21:15:08.491	Super Admin	$2b$12$wEsZMZ3KbPWBfGHZZC8esOzCtHDWkrWJ2eL6eNWbc23rTjBbErG4O
6445aaca-684e-4ba9-bf07-d83690177f9b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Juan	Cruz	owner@muscle-mania.com	\N	OWNER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:08.686	2025-08-15 21:15:08.686	Juan Cruz	$2b$12$wTI0hr9cS2VcED3F8Qn3QOsFidZdy70ia29vrCOawcSGeGw5Kck6i
4427ab80-2b56-4489-9cd7-95ec53388a68	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Manager1	Cruz	manager1@muscle-mania.com	\N	MANAGER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:08.893	2025-08-15 21:15:08.893	Manager1 Cruz	$2b$12$1s7TYl6bhiWLIyq7w0QVYex5bIibB.4QD0GUfGv2nu187YOq/oqdC
b8493cbd-a496-4218-8edb-557f13a8c94b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Staff1	Branch1	staff11@muscle-mania.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:09.067	2025-08-15 21:15:09.067	Staff1 Branch1	$2b$12$vEFtQ1wCgHB.NmK7yhrl/O28OYDrQbJtlij9SiJCO8IKsgxYKMlSq
6bf085ab-6fca-47e9-abd8-d654ad2bd6f6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Staff2	Branch1	staff12@muscle-mania.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:09.242	2025-08-15 21:15:09.242	Staff2 Branch1	$2b$12$iyNqtlMNxQ4YgRikysLLhePzTVQU/nN1ilb1MFXnu4F8SEqSfkqxq
d9b274b3-4612-4080-afe1-fca9f2676f5b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	John	Doe	john1b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-19T21:15:09.434Z", "totalVisits": 94, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 187, "weight": 99, "dateOfBirth": "2003-09-21T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Doe", "phone": "+63 9116841014", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:09.435	2025-08-15 21:15:09.435	John Doe	$2b$12$7FGfQDgDMuCcSdUWwcrzXuuE4pwFXZWpHlWtC5Ytajt1hRB74k99a
e2b904c8-4390-407b-9b43-ead7f4b5d630	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jane	Smith	jane2b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-01T21:15:09.624Z", "totalVisits": 126, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 177, "weight": 88, "dateOfBirth": "2004-01-25T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Smith", "phone": "+63 9101196403", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:09.625	2025-08-15 21:15:09.625	Jane Smith	$2b$12$23V0VkrNnnQQV3cfUPcN3e.BwiZTvjQVfVqFbO8QtL.0Hof68WeWG
06f6b164-7dfd-4ad7-88c0-c9ae71aefd87	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Mike	Johnson	mike3b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:09.804Z", "totalVisits": 72, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 156, "weight": 93, "dateOfBirth": "1999-02-03T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9242913437", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:09.805	2025-08-15 21:15:09.805	Mike Johnson	$2b$12$KwiiyIqJdZqEteIW08Z5NOE0RHlfuFbxOyxqilIlQELarFwbaCRge
2cdcdde8-2186-4b3b-a85b-0425fceaa4cb	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Sarah	Wilson	sarah4b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-10T21:15:09.992Z", "totalVisits": 205, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 188, "weight": 68, "dateOfBirth": "1995-07-10T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9430331060", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:09.993	2025-08-15 21:15:09.993	Sarah Wilson	$2b$12$rOpNGpJI5GBbPIapZ/695u9/bPA6VYh/tXPUJW5RoP5gz8g8Vnf3S
993ff5fe-cf19-448b-af59-ae2f58e326da	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	David	Chen	david5b1@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:10.182Z", "totalVisits": 89, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 166, "weight": 51, "dateOfBirth": "1984-06-17T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9485517965", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:10.183	2025-08-15 21:15:10.183	David Chen	$2b$12$vbhgvMY08GUooJdyRP6hNeYV7SIZwju.a.KUL/ysFSp/WfNnjXoLi
13fae61b-191a-40e9-b101-7eef30491653	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Emily	Rodriguez	emily6b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:10.360Z", "totalVisits": 187, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 160, "weight": 87, "dateOfBirth": "1989-02-26T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Rodriguez", "phone": "+63 9274228442", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:10.361	2025-08-15 21:15:10.361	Emily Rodriguez	$2b$12$O0okHBqHiu2nAMJSqqE9p.t6T8T/UNHJQNwT64rPf870PEM1gnqM.
9ea655bd-4bc9-40bc-887c-9087e6678658	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Carlos	Martinez	carlos7b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-04T21:15:10.547Z", "totalVisits": 80, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 154, "weight": 75, "dateOfBirth": "2009-02-14T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Martinez", "phone": "+63 9499745100", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:10.548	2025-08-15 21:15:10.548	Carlos Martinez	$2b$12$AdEBTpVa9B7g5B17l7ADpe8PRpV8eErOoAkk6ne.mwCTmqyxHg8O6
e1a36b51-7d48-49fd-8306-3661f50de347	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Lisa	Wang	lisa8b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-31T21:15:10.735Z", "totalVisits": 41, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 173, "weight": 97, "dateOfBirth": "1985-10-26T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Wang", "phone": "+63 9711302233", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:10.736	2025-08-15 21:15:10.736	Lisa Wang	$2b$12$yoZT.X14lY871JBkuiPna.JgRN8ja.8vBipvKlzMzd8uK0CymBm7a
a5876288-ddff-4c74-878f-5b9762e08aab	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Tom	Anderson	tom9b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-15T21:15:10.918Z", "totalVisits": 108, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 168, "weight": 57, "dateOfBirth": "1995-03-23T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Anderson", "phone": "+63 9673812990", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:10.919	2025-08-15 21:15:10.919	Tom Anderson	$2b$12$HlKs5e1XgAXa8vz9mk32WuC95F8t5b/USfPqzOvbjIQLGuWmBSrme
585e7aeb-f15b-40ed-baad-2d6bc65022c1	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Anna	Garcia	anna10b1@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-01T21:15:11.100Z", "totalVisits": 101, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 159, "weight": 63, "dateOfBirth": "1987-11-01T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Garcia", "phone": "+63 9593957149", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:11.101	2025-08-15 21:15:11.101	Anna Garcia	$2b$12$3oQZMOjhM/o7Ai1VrGnAsu7p2S7x6e795uepqTO1mEN2TVDDkUwdi
1a548a32-8f15-4374-bb1d-4423936da4c6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Robert	Kim	robert11b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:11.284Z", "totalVisits": 67, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 163, "weight": 97, "dateOfBirth": "1989-10-19T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Kim", "phone": "+63 9517695541", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:11.285	2025-08-15 21:15:11.285	Robert Kim	$2b$12$D/TnApk79.RTAxxU2hUQYevdZlemmR7/B694vPasibBTLd3TRuSYO
88f7822d-7d0f-4086-bf04-c060ac7be4bc	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jennifer	Lopez	jennifer12b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-27T21:15:11.460Z", "totalVisits": 27, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 166, "weight": 54, "dateOfBirth": "2001-03-06T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Lopez", "phone": "+63 9726413581", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:11.461	2025-08-15 21:15:11.461	Jennifer Lopez	$2b$12$ebiJhXvKYpMZigRmClBR4e8HSMrrqEL9U.Eu4Vn84VZpaHv6gtoS6
639a83aa-f46f-4606-88af-55a4dd02c426	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Michael	Brown	michael13b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-21T21:15:11.641Z", "totalVisits": 149, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 173, "weight": 92, "dateOfBirth": "2003-09-04T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Brown", "phone": "+63 9281044847", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:11.642	2025-08-15 21:15:11.642	Michael Brown	$2b$12$ibS2ieB5ViEUWa6FzPHO4eQ0p7e9yaa8ZR9RHCxe9NBEP8AUfvQSq
e3841aaa-cd05-4920-b236-76b6a22a683d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jessica	Davis	jessica14b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-17T21:15:11.825Z", "totalVisits": 76, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 185, "weight": 65, "dateOfBirth": "2008-12-14T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Davis", "phone": "+63 9566277498", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:11.825	2025-08-15 21:15:11.825	Jessica Davis	$2b$12$gEe.92ndRFMK1NLioQI64emjuCCjjhFZTt7vELAoz53mXhBy4MNHS
5a589fc7-f6e9-4ad5-8823-4e1e09e2d009	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Daniel	Lee	daniel15b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:12.012Z", "totalVisits": 85, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 169, "weight": 62, "dateOfBirth": "1995-03-08T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Lee", "phone": "+63 9328768334", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:12.013	2025-08-15 21:15:12.013	Daniel Lee	$2b$12$D9Leqgp0YuMfWRaelHKbdu9t/8vT0UgBiilkYyIvzq58vNd2QFpcm
40eb8a4b-f4aa-4583-b961-a68b6077638c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Amanda	Taylor	amanda16b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-21T21:15:12.194Z", "totalVisits": 155, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 183, "weight": 84, "dateOfBirth": "1989-04-09T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Taylor", "phone": "+63 9312763946", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:12.195	2025-08-15 21:15:12.195	Amanda Taylor	$2b$12$cOi.KeMWa90IDBePg8tDaOA2LwXw1uDqBdABfZDJPVXPKWx8/AtD6
d1a1c54a-cc81-4748-8bf0-749e288d1513	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Chris	Wilson	chris17b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-18T21:15:12.376Z", "totalVisits": 181, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 179, "weight": 74, "dateOfBirth": "1997-08-24T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9570943725", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:12.377	2025-08-15 21:15:12.377	Chris Wilson	$2b$12$oUF8fVi6cSjnbIENX6atHOXOJdP0B/k2G9NUOyL3eCLfEmTOf5I2y
6ee2317c-d4db-4ab1-811a-5a0518170334	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Nicole	Johnson	nicole18b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-06T21:15:12.560Z", "totalVisits": 20, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 180, "weight": 54, "dateOfBirth": "1984-05-22T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9714440947", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:12.561	2025-08-15 21:15:12.561	Nicole Johnson	$2b$12$6Ydm/TlJHWOxxEOYkbfdhuJKb39LCmOJnGyU1phOBOYw78xgZU5ZW
7b4241a4-d346-4ce6-9a5f-5b65d2898b53	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Brandon	Miller	brandon19b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-10T21:15:12.742Z", "totalVisits": 138, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 179, "weight": 85, "dateOfBirth": "1984-05-27T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Miller", "phone": "+63 9125756256", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:12.743	2025-08-15 21:15:12.743	Brandon Miller	$2b$12$lzZogcTivb4OXfHRTdUcw.MNqriS8UaggKagrNHSjesuWQQeEk1jS
d4340de3-112d-4c75-8c34-71fadc980e2e	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Stephanie	Jones	stephanie20b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:12.917Z", "totalVisits": 196, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 179, "weight": 69, "dateOfBirth": "2002-04-19T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Jones", "phone": "+63 9606691825", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:12.918	2025-08-15 21:15:12.918	Stephanie Jones	$2b$12$KhoWpiShjvf2Gz4dpZvOl.aT1YdqKe0cd5jg.q5saRA/jbT4H4IuO
5530a1b4-2b3d-4db3-af3a-ca59a0ba7b31	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Kevin	Chen	kevin21b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:13.098Z", "totalVisits": 68, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 161, "weight": 87, "dateOfBirth": "1985-03-09T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9412680452", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:13.099	2025-08-15 21:15:13.099	Kevin Chen	$2b$12$eIS2thALVavcOVweroTlL.o266DXBXFx4/Pc.5aEY/mwuXr7IWWE6
1f7502dd-2a0f-4131-8300-affd8822c509	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Rachel	Green	rachel22b1@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-04T21:15:13.279Z", "totalVisits": 203, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 185, "weight": 84, "dateOfBirth": "1981-08-04T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Green", "phone": "+63 9855087979", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:13.28	2025-08-15 21:15:13.28	Rachel Green	$2b$12$cBNeaJLqlKCAFcg7HAHtLeMUXEjWwPa81yY19Igcen2fVLFq.KcWW
e9315acf-58fa-4e64-9117-6e040924692c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Manager2	Cruz	manager2@muscle-mania.com	\N	MANAGER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:13.468	2025-08-15 21:15:13.468	Manager2 Cruz	$2b$12$eoQq.qIihiH9b.X2Cma6a.JXeSza0XSV247LeYd0MiJkBXmRm6mrS
bf1bfffa-1df1-440b-b39f-23364db0d7be	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Staff1	Branch2	staff21@muscle-mania.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:13.641	2025-08-15 21:15:13.641	Staff1 Branch2	$2b$12$Q21shbfd1VT13Aow1URD4.PGG70bt5H07PbXhw5lSXp1bHgXmZWFS
cd6b0c4f-7507-4ba6-a977-c9d4d5fef345	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Staff2	Branch2	staff22@muscle-mania.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:13.817	2025-08-15 21:15:13.817	Staff2 Branch2	$2b$12$xZSRmv6zqIiSQW7uoZie0Ou0fHCBbbLLVODyvOI7Ex4STRXW34U02
8ecf2bb7-4fdb-41c7-b615-8ed01690d6a6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	John	Doe	john1b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-30T21:15:14.002Z", "totalVisits": 201, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 153, "weight": 78, "dateOfBirth": "1988-08-04T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Doe", "phone": "+63 9122231513", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:14.003	2025-08-15 21:15:14.003	John Doe	$2b$12$X1fbyQZ2bZKVzjwPCfn2UuKAZUpFJGHq21ensbBBqVOg69Noi0s2u
a63a6b34-9f04-4d0a-8ee8-48268bfe66a0	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jane	Smith	jane2b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-30T21:15:14.174Z", "totalVisits": 52, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 173, "weight": 94, "dateOfBirth": "2002-06-15T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Smith", "phone": "+63 9165080405", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:14.175	2025-08-15 21:15:14.175	Jane Smith	$2b$12$frRMZ3lGRcyUT1/BRoFU8.R63QPCpJ3Kws2BCX6qvGIF7rcv8QyNy
64ca15dc-77e0-4312-9a01-34c03133c013	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Mike	Johnson	mike3b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-29T21:15:14.355Z", "totalVisits": 96, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 150, "weight": 69, "dateOfBirth": "1999-11-16T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9599765269", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:14.356	2025-08-15 21:15:14.356	Mike Johnson	$2b$12$gY0VoMsImYKPG7Wk8G9lw.2IUMLl5pTeAI8JnMgn6pkpoXAaMe92e
dc41b15c-9291-4f4d-9f3c-93d555c5ea9b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Sarah	Wilson	sarah4b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-06T21:15:14.540Z", "totalVisits": 153, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 188, "weight": 48, "dateOfBirth": "1989-06-27T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9740553439", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:14.542	2025-08-15 21:15:14.542	Sarah Wilson	$2b$12$Mwf85yPd5j3/oDsbsdJ6ZOzwARJdRC6oFsxxOYoUAQrwMLONqQpz2
7c8ac662-a5f2-44a5-8751-e115855f49c6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	David	Chen	david5b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-06T21:15:14.724Z", "totalVisits": 34, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 178, "weight": 65, "dateOfBirth": "2004-07-14T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9364033664", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:14.725	2025-08-15 21:15:14.725	David Chen	$2b$12$VhCxUQFIASkk8UM6/.7ldOT3lE712Cn8pJ0NTTUplLrTu2q62xTpe
e0c9cf5b-bd38-47b5-b157-673087594195	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Emily	Rodriguez	emily6b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:14.908Z", "totalVisits": 71, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 163, "weight": 85, "dateOfBirth": "1997-05-05T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Rodriguez", "phone": "+63 9485869795", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:14.909	2025-08-15 21:15:14.909	Emily Rodriguez	$2b$12$iU.9W7pLqcG9LGCe.a92DO2/58DUJfG9mcLoxDxnmXtccmf7DBBsW
26cf28c0-fa6d-4a68-b300-c1b78b174e38	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Carlos	Martinez	carlos7b2@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-02T21:15:15.083Z", "totalVisits": 157, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 181, "weight": 87, "dateOfBirth": "2000-04-03T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Martinez", "phone": "+63 9577970972", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:15.084	2025-08-15 21:15:15.084	Carlos Martinez	$2b$12$NeIZcjqf3fmdimeGXG3DduJBEkYdD7Beva.5PgCnZTernICCPjmpq
bd3a1fdf-1b4a-4293-b0d7-6afecf284db1	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Lisa	Wang	lisa8b2@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-29T21:15:15.253Z", "totalVisits": 180, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 169, "weight": 87, "dateOfBirth": "1980-12-02T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Wang", "phone": "+63 9727270044", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:15.254	2025-08-15 21:15:15.254	Lisa Wang	$2b$12$Nzdy.12/iJsxN4xk8pbonOvOoqUmbtZjL2/cjDHpMOUAbqzfDWHAq
a2d92660-477e-4804-a4ee-defa4fea6db6	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Tom	Anderson	tom9b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:15.436Z", "totalVisits": 50, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 163, "weight": 79, "dateOfBirth": "1986-09-11T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Anderson", "phone": "+63 9581471290", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:15.436	2025-08-15 21:15:15.436	Tom Anderson	$2b$12$3VNpMtQugg/2HAyhbOXW9.YJkrnJOLb2VAgDe8o/fNE7/1Tjh2EKC
ed7b4704-9872-4e7f-a799-2a08a4694241	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Anna	Garcia	anna10b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-30T21:15:15.616Z", "totalVisits": 118, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 172, "weight": 55, "dateOfBirth": "1994-05-20T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Garcia", "phone": "+63 9795182622", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:15.617	2025-08-15 21:15:15.617	Anna Garcia	$2b$12$iH/34TMYa08rA9AtKe70h...3qH9LtU6CoCe6c6nTw3vf5NuKNZ5K
f9e935d8-2de6-44fc-a2d4-d7f9a58a4224	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Robert	Kim	robert11b2@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-12T21:15:15.798Z", "totalVisits": 195, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 182, "weight": 81, "dateOfBirth": "1983-02-21T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Kim", "phone": "+63 9246480394", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:15.799	2025-08-15 21:15:15.799	Robert Kim	$2b$12$ASM2EfgGit7p797XQBbH3eOWwT4zHRu/Riisc3f3C6RVkJsFV//h6
0f3f75a5-257a-4ecc-bd35-d9ce44e44510	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jennifer	Lopez	jennifer12b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-06T21:15:15.991Z", "totalVisits": 56, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 178, "weight": 71, "dateOfBirth": "1990-05-26T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Lopez", "phone": "+63 9457222985", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:15.992	2025-08-15 21:15:15.992	Jennifer Lopez	$2b$12$LiAuTxyYUogUo3NcwVlvfeeQt0besMIRzMaeI6TR0Nx2tTVlRZTRm
a782550d-3c55-4360-b04b-592f7fcb7251	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Michael	Brown	michael13b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:16.173Z", "totalVisits": 22, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 151, "weight": 58, "dateOfBirth": "2000-08-27T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Brown", "phone": "+63 9103813537", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:16.174	2025-08-15 21:15:16.174	Michael Brown	$2b$12$RiDm35RVvWjHR7sD2mWAt.5CCt93u7uCEnxL3UrpzjIyXglpB8hwW
a44fd54f-c58d-447f-ada5-d5550dfac49a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jessica	Davis	jessica14b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:16.361Z", "totalVisits": 205, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 180, "weight": 94, "dateOfBirth": "2004-01-04T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Davis", "phone": "+63 9154080018", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:16.362	2025-08-15 21:15:16.362	Jessica Davis	$2b$12$dhjbRyZhCrpop4Y2WyAWVebN5E98Kwr0q9efGx/HLUTiCRfRtWGL2
4f8cb99f-4027-4cbe-94c1-203953439e37	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Daniel	Lee	daniel15b2@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-04T21:15:16.566Z", "totalVisits": 187, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 155, "weight": 45, "dateOfBirth": "1992-01-09T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Lee", "phone": "+63 9199606568", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:16.567	2025-08-15 21:15:16.567	Daniel Lee	$2b$12$cD4GkTGQ7jZN93DKqNiqaOY1bLr8FFnd3pDqSBvz9fW8g8kZDcyo.
0cf489e8-4901-48b5-95a3-b865c9ec4e7d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Amanda	Taylor	amanda16b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-29T21:15:16.749Z", "totalVisits": 133, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 189, "weight": 62, "dateOfBirth": "1998-01-08T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Taylor", "phone": "+63 9729840139", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:16.75	2025-08-15 21:15:16.75	Amanda Taylor	$2b$12$.7UGqXD7g6vb3BWp72ieIO8a9S6ATexeChaBfRpLzZwEAB7biLCPO
b64c164b-200f-4fa2-b3ef-0fb8f1a2885b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Chris	Wilson	chris17b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-01T21:15:16.935Z", "totalVisits": 78, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 178, "weight": 52, "dateOfBirth": "1989-05-28T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9828427372", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:16.936	2025-08-15 21:15:16.936	Chris Wilson	$2b$12$eTwhBEV9iuzQ9MYD9ykhGO9TMYe1BA24SZNHe5FAGQtUuqSaE9KQC
a23cee81-923d-4e29-8778-13a56088dacb	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Nicole	Johnson	nicole18b2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:17.122Z", "totalVisits": 29, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 178, "weight": 84, "dateOfBirth": "1986-06-23T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9882515147", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:17.123	2025-08-15 21:15:17.123	Nicole Johnson	$2b$12$Yoa9.noLB8xcx08/T1QlKOR2rQIuWo1SwfMmqJVhXszL5R3I7Gkae
6041c766-6626-4b46-8a0c-1d29b464e6d3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Brandon	Miller	brandon19b2@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:17.300Z", "totalVisits": 111, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 187, "weight": 52, "dateOfBirth": "1987-09-13T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Miller", "phone": "+63 9119862514", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:17.302	2025-08-15 21:15:17.302	Brandon Miller	$2b$12$jHwzAhpZOpzIPwgfrjuI1.Ac6ukQW2hqiNJQCYyIWj34wEe7uLyX.
a039a171-caeb-48b4-bde4-52ab65c3c174	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Manager3	Cruz	manager3@muscle-mania.com	\N	MANAGER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:17.491	2025-08-15 21:15:17.491	Manager3 Cruz	$2b$12$6dO8u4ebA/6UdNb32cTmbOq1cmSqr3ec9VDOQcPXG0TZnuCbPafXq
54867cf0-3995-4173-912d-8212d6cb18e3	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Staff1	Branch3	staff31@muscle-mania.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:17.669	2025-08-15 21:15:17.669	Staff1 Branch3	$2b$12$eqIGat17Gilil8NX.mrc8OQh6ZCKoiVgBw4GlRa0MNCvsProtxp/G
36e54d67-fced-4e51-be2e-10b4edfe066a	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Staff2	Branch3	staff32@muscle-mania.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:17.843	2025-08-15 21:15:17.843	Staff2 Branch3	$2b$12$coHOeGNKHxokFUk.vyC0rOa/qvQZpvLBGmRZA9wyH1LWxCg3ZrHe2
b29d347c-9ead-4449-ad79-3c6e87c24acc	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	John	Doe	john1b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-18T21:15:18.027Z", "totalVisits": 121, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 167, "weight": 56, "dateOfBirth": "2003-01-23T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Doe", "phone": "+63 9185671189", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:18.028	2025-08-15 21:15:18.028	John Doe	$2b$12$xQLqESXutesrzTCS7LjCt.xEeOAlBaDmQ8iEdsxYXj/zpJ11EM1Qa
6ff363cd-6c14-46f1-ae83-349ee293ea20	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jane	Smith	jane2b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-18T21:15:18.212Z", "totalVisits": 111, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 151, "weight": 48, "dateOfBirth": "1993-11-11T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Smith", "phone": "+63 9762539470", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:18.213	2025-08-15 21:15:18.213	Jane Smith	$2b$12$hnrCjTMhM6KO0d7W4YBkte1fZUlJVQkKvTE33LjzS010tZZcVrk2S
4865da07-51ea-4bdc-8b92-be9772e6560f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Mike	Johnson	mike3b3@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-09T21:15:18.392Z", "totalVisits": 152, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 187, "weight": 96, "dateOfBirth": "1989-10-06T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9415651590", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:18.393	2025-08-15 21:15:18.393	Mike Johnson	$2b$12$rOot0qJHobinzeP5zLTuOegEV88J8iDf8ITOo3vjuFJ9Ikmq3GUDS
294a9115-ad8c-4b7a-aaaa-bbe6ac9eb834	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Sarah	Wilson	sarah4b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-04T21:15:18.568Z", "totalVisits": 78, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 181, "weight": 79, "dateOfBirth": "1982-06-11T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9851194592", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:18.569	2025-08-15 21:15:18.569	Sarah Wilson	$2b$12$i4DL1wdqc2guw8Sp82sKKuy6vWcerReD.sJnKXyKdBUGbzXvOHXh6
235d201b-9a65-4f56-be06-fb7707e7e26b	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	David	Chen	david5b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:18.750Z", "totalVisits": 22, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 164, "weight": 87, "dateOfBirth": "1995-04-09T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9535509192", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:18.751	2025-08-15 21:15:18.751	David Chen	$2b$12$U2yNkDVkowg8J6q1YuFXMOASR6cTc1E8uimb8Iu93ocWpdZdN2xCS
76a2b8f3-4285-488f-8802-443a7795c971	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Emily	Rodriguez	emily6b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-19T21:15:18.933Z", "totalVisits": 55, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 155, "weight": 52, "dateOfBirth": "2007-08-08T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Rodriguez", "phone": "+63 9785172375", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:18.934	2025-08-15 21:15:18.934	Emily Rodriguez	$2b$12$3XW2XG4ACfO3k47W/ucZLeUtKPh5WrThzmWzS1/2LhTlJ5yG0TDsi
795e3897-f051-4f99-bd3e-144e3eb75a2d	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Carlos	Martinez	carlos7b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:19.115Z", "totalVisits": 109, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 171, "weight": 60, "dateOfBirth": "1980-06-12T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Martinez", "phone": "+63 9124096959", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:19.116	2025-08-15 21:15:19.116	Carlos Martinez	$2b$12$Tqom.zg6zZOUPN3vdOXdSuC2nbB0SehUvqc8QQH3281jInCMcCAP2
0a3ff09b-fb4f-48aa-834e-1f3242c71191	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Lisa	Wang	lisa8b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:19.299Z", "totalVisits": 121, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 155, "weight": 84, "dateOfBirth": "1987-05-20T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Wang", "phone": "+63 9916512518", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:19.3	2025-08-15 21:15:19.3	Lisa Wang	$2b$12$Tb0rVfLASCYWrGYArUMokOpezNwhAhGkGQ6ULirOZmWQeyDKgcK9q
bdfb52b4-4099-43b6-a5ad-e105d73ee9cd	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Tom	Anderson	tom9b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-28T21:15:19.482Z", "totalVisits": 118, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 161, "weight": 66, "dateOfBirth": "2005-12-21T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Anderson", "phone": "+63 9445909794", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:19.483	2025-08-15 21:15:19.483	Tom Anderson	$2b$12$SiGomc.w7r/hsps.WteoQOqx9FCvobQTgk.oOq4Jf8Ptplv6yDv9m
838c2609-41f0-4370-95f0-706698b35c2c	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Anna	Garcia	anna10b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:19.666Z", "totalVisits": 191, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 153, "weight": 86, "dateOfBirth": "2002-02-22T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Garcia", "phone": "+63 9474571877", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:19.667	2025-08-15 21:15:19.667	Anna Garcia	$2b$12$P722q3vwzi0.OsbAKrJtJuz6f8XCHcP1IcyMZKO/zEIJ4Dd9EbLbS
9dc6450b-37bd-489a-8053-ce0c673cf484	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Robert	Kim	robert11b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-09T21:15:19.838Z", "totalVisits": 15, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 181, "weight": 49, "dateOfBirth": "1981-05-16T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Kim", "phone": "+63 9734896207", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:19.839	2025-08-15 21:15:19.839	Robert Kim	$2b$12$XE9RQg94EO0UWyWnnBVq0O2ct.yqPRo2F/44pbKcdJp/u5fNEPk/S
baafbac5-b320-4a5b-b113-4b332d15a351	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jennifer	Lopez	jennifer12b3@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-17T21:15:20.011Z", "totalVisits": 106, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 154, "weight": 49, "dateOfBirth": "2003-01-08T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Lopez", "phone": "+63 9340765082", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:20.013	2025-08-15 21:15:20.013	Jennifer Lopez	$2b$12$zESm8kmeTdlgxBsg0nOu.OomKupCnN1xI4nEwictrH99tcx16PxW6
9339893c-3a56-4e48-8613-8fd3962ed2da	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Michael	Brown	michael13b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-08T21:15:20.185Z", "totalVisits": 148, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 179, "weight": 96, "dateOfBirth": "1989-06-10T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Brown", "phone": "+63 9493753343", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:20.187	2025-08-15 21:15:20.187	Michael Brown	$2b$12$EBEho7AyNazd6xrxvXx.iOn7i8u51032D6JWF93xp9/Bpyxh.6zxO
a6c57000-0c2c-4d31-83e6-e0244c497009	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jessica	Davis	jessica14b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-07T21:15:20.361Z", "totalVisits": 47, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 184, "weight": 94, "dateOfBirth": "1984-05-12T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Davis", "phone": "+63 9528572238", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:20.362	2025-08-15 21:15:20.362	Jessica Davis	$2b$12$7cq0JSalmQidVeq//TGibeZI6nSxSu/vGieiiwIupclM..WZIEGoi
bda45883-e863-4814-bdcf-9554683c43b2	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Daniel	Lee	daniel15b3@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-02T21:15:20.551Z", "totalVisits": 128, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 155, "weight": 73, "dateOfBirth": "1996-03-06T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Lee", "phone": "+63 9827609450", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:20.552	2025-08-15 21:15:20.552	Daniel Lee	$2b$12$IN8FdfVJUXHlDAm2aP5AR.3Je8LCo1h5Tp9Y2Of.zhik/eYSKHdbG
91c3108c-aa48-4b84-9bf3-d284889d4fa5	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Amanda	Taylor	amanda16b3@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-07T21:15:20.743Z", "totalVisits": 15, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 175, "weight": 59, "dateOfBirth": "2003-09-26T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Taylor", "phone": "+63 9896555075", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:20.744	2025-08-15 21:15:20.744	Amanda Taylor	$2b$12$/6LHa/RdWAeFDnwW0y58t.Yj5cSJFcS/a4Vz0u.o7IugwmWviaqAm
9380fa3e-bad2-4113-b2e6-69d657daa575	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Maria	Santos	owner@chakara.com	\N	OWNER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:20.934	2025-08-15 21:15:20.934	Maria Santos	$2b$12$0n0kCJX1lk0DXkavAn.K0OV1fzMkeaLvaLQasFg2BG7EZy9xHqTCW
3420c898-0c22-4237-8b9e-494c379a4523	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Manager1	Santos	manager1@chakara.com	\N	MANAGER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:21.143	2025-08-15 21:15:21.143	Manager1 Santos	$2b$12$WAK0mOd9w47hXvLfvSa4PeDxRUeXND1fLPN3Wn.KnjyNpbaRnYZyS
a5518138-61d8-492f-a0b4-59c98b795bb5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Staff1	Branch1	staff11@chakara.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:21.321	2025-08-15 21:15:21.321	Staff1 Branch1	$2b$12$lY5JOploPR1d3e0xg5tIdOKNVgo4bObXuYphIXYTsEJuSXuvGcRv.
b6c8dcfe-9863-4927-92b1-25634cea90f9	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Staff2	Branch1	staff12@chakara.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:21.495	2025-08-15 21:15:21.495	Staff2 Branch1	$2b$12$sYJvIOtfN5WqQwF8nlJN9.pEftqXHlnNxHXaeBEyWxdDu3a94t6CW
afa1faf3-db3d-489f-8893-d8839942fb3f	d9e2fdf8-6b16-4340-97ec-5eace22acc57	John	Doe	john1b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-17T21:15:21.678Z", "totalVisits": 134, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 163, "weight": 64, "dateOfBirth": "1999-03-08T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Doe", "phone": "+63 9632176733", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:21.679	2025-08-15 21:15:21.679	John Doe	$2b$12$qAdd5TEoP.7g3/Zbi.JvR.Up7N1wOCzU2dWe7ybxVxuUTHc74I7Rq
995c59db-a459-4a88-a75e-305c1ca41313	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jane	Smith	jane2b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-05T21:15:21.861Z", "totalVisits": 144, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 186, "weight": 88, "dateOfBirth": "1984-06-03T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Smith", "phone": "+63 9267362013", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:21.862	2025-08-15 21:15:21.862	Jane Smith	$2b$12$WiDn27Xz4us/nN8JWQDJkOZaMC3gynWGBhB/EO8qZuKJ.pd.P1U8C
6bf33357-06b2-4d2c-945b-8891389fb68b	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Mike	Johnson	mike3b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:22.041Z", "totalVisits": 127, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 154, "weight": 96, "dateOfBirth": "1982-08-10T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9571076521", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:22.042	2025-08-15 21:15:22.042	Mike Johnson	$2b$12$FkqLdcLfZ9sdxRr0/nh.s.d4KSAQHN2tZ/kVJFfibcFYFPNrScJgC
cd266fd9-21b6-47cd-a42c-080a1ced11ee	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Lawrence	Reeves	varewofuji@mailinator.com	\N	GYM_MEMBER	t	\N	\N	{"healthInfo": {"allergies": [], "fitnessLevel": "", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "", "preferredWorkoutTime": ""}, "personalInfo": {"gender": "", "height": null, "weight": null, "dateOfBirth": null, "fitnessGoals": "", "emergencyContact": {"name": "", "phone": "", "relationship": ""}}}	\N	\N	2025-08-16 06:10:17.153	2025-08-16 06:18:14.703	\N	\N
8a02baab-c306-429e-b620-077e917badd0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Sarah	Wilson	sarah4b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-06T21:15:22.226Z", "totalVisits": 99, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 159, "weight": 99, "dateOfBirth": "1999-03-27T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9309745357", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:22.227	2025-08-15 21:15:22.227	Sarah Wilson	$2b$12$wFTBBIHkYSu49kj3ku3GnOVAgeD/DvHAx9EcgB.ri4ZtQIPu3fsjO
f09a2351-e775-4431-8b76-883f944dd3fd	d9e2fdf8-6b16-4340-97ec-5eace22acc57	David	Chen	david5b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:22.407Z", "totalVisits": 194, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 186, "weight": 45, "dateOfBirth": "1985-10-26T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9661488140", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:22.408	2025-08-15 21:15:22.408	David Chen	$2b$12$Gvf5osXrjVeXvX55wzCgUO/UCIbCrfri6dK2bTVvDAR46j85Aefyu
dfd3b910-7871-4e6e-a839-4590947b517d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Emily	Rodriguez	emily6b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:22.587Z", "totalVisits": 92, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 180, "weight": 76, "dateOfBirth": "1982-10-18T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Rodriguez", "phone": "+63 9302981395", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:22.588	2025-08-15 21:15:22.588	Emily Rodriguez	$2b$12$i3Nkc2gflucsQdHNeC9VOOVZJDIHttXc3emoT59iPU22C7F2XoqMC
699da01d-d578-41ec-b4ca-d0e46f6798f5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Carlos	Martinez	carlos7b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-09T21:15:22.777Z", "totalVisits": 104, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 155, "weight": 71, "dateOfBirth": "1987-10-22T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Martinez", "phone": "+63 9771640676", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:22.778	2025-08-15 21:15:22.778	Carlos Martinez	$2b$12$RU2jgWH885EfUF0IkrTLa.26KPwPQsUzXb4w6E9ojlOyji5RoHMIO
c74961d3-ba1c-4ee5-aeb2-44877ef69675	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Lisa	Wang	lisa8b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:22.956Z", "totalVisits": 36, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 170, "weight": 90, "dateOfBirth": "1982-02-05T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Wang", "phone": "+63 9755235855", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:22.957	2025-08-15 21:15:22.957	Lisa Wang	$2b$12$qXwigvXhkd.UOf718LPjg.lNBOEbASQw0hBCWQdjPkHIhm21H/G8q
c888a561-f343-4903-8403-fa3e344700bf	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Tom	Anderson	tom9b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-15T21:15:23.145Z", "totalVisits": 129, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 170, "weight": 63, "dateOfBirth": "1980-05-04T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Anderson", "phone": "+63 9792126002", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:23.146	2025-08-15 21:15:23.146	Tom Anderson	$2b$12$j8XDqq.0zIJ8BY8vQwRigO9AW9.jFUatuoDlHwuL50PIGshVkwCrm
4c76499d-0a6e-483b-9abc-717b4719e48b	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Anna	Garcia	anna10b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-25T21:15:23.332Z", "totalVisits": 193, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 166, "weight": 61, "dateOfBirth": "1981-04-18T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Garcia", "phone": "+63 9805083448", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:23.334	2025-08-15 21:15:23.334	Anna Garcia	$2b$12$GRx9Q2fNXh9gqZlQCA2ZYumBakNP7oOecvev5Rn54i0y3LQA8n6IS
3a1b2349-5c38-410d-afe2-e00841274936	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Robert	Kim	robert11b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:23.515Z", "totalVisits": 135, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 168, "weight": 71, "dateOfBirth": "1987-03-17T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Kim", "phone": "+63 9561196616", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:23.517	2025-08-15 21:15:23.517	Robert Kim	$2b$12$jW4tezBp7J4Jy/5IjIB/Aub1B3mDgRZN4ATW6SPjSdhfr.0C/4OKm
f8522206-fe3f-4430-90ec-2227a7f74b04	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Zelenia update	Mosley	ziloqyw@mailinator.com	\N	GYM_MEMBER	t	\N	\N	{"healthInfo": {"allergies": [], "fitnessLevel": "", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "", "preferredWorkoutTime": ""}, "personalInfo": {"gender": "", "height": null, "weight": null, "dateOfBirth": null, "fitnessGoals": "", "emergencyContact": {"name": "", "phone": "", "relationship": ""}}}	\N	\N	2025-08-16 05:41:44.948	2025-08-16 06:18:28.517	\N	\N
4053317b-c36e-4cfa-afc3-380077c8eeb1	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jennifer	Lopez	jennifer12b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:23.711Z", "totalVisits": 194, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 179, "weight": 83, "dateOfBirth": "1983-12-27T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Lopez", "phone": "+63 9791098277", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:23.712	2025-08-15 21:15:23.712	Jennifer Lopez	$2b$12$Gj3I99ie/RT8h24uO/1amOQrs2CzxkNSaAj6MelnL.wl25lFkBkgq
e4624fb5-1793-4b5d-806e-491ebeec1583	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Michael	Brown	michael13b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:23.912Z", "totalVisits": 157, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 188, "weight": 82, "dateOfBirth": "1997-10-04T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Brown", "phone": "+63 9583596070", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:23.913	2025-08-15 21:15:23.913	Michael Brown	$2b$12$JA6uyl9ZJXKU3WCWbi7FzOA6TrElzD69b6Fe1F/A5mVkQL7qz3s2C
b5712765-0812-49e4-a8f5-daa61a3f5791	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jessica	Davis	jessica14b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-30T21:15:24.158Z", "totalVisits": 95, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 163, "weight": 61, "dateOfBirth": "1989-11-12T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Davis", "phone": "+63 9912978755", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:24.159	2025-08-15 21:15:24.159	Jessica Davis	$2b$12$GSwGrda8AeP5cbV2LdHXk.SQfQf7DrkyNcxAb2s2r0l8HJYH6E9ma
3d65100b-25ab-46fd-b4a2-f1d4df263ca8	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Daniel	Lee	daniel15b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-09T21:15:24.398Z", "totalVisits": 104, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 189, "weight": 52, "dateOfBirth": "2001-02-17T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Lee", "phone": "+63 9578115788", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:24.399	2025-08-15 21:15:24.399	Daniel Lee	$2b$12$Ct0Cy5ziqU6KSo8YyeJIeuSu/MtYiSFUbiRw/JJwsno.4VBydd1qG
bd53a564-62dc-4e71-b287-fbc4aa95ff45	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Amanda	Taylor	amanda16b1@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:24.620Z", "totalVisits": 100, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 159, "weight": 76, "dateOfBirth": "2009-06-28T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Taylor", "phone": "+63 9828720053", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:24.621	2025-08-15 21:15:24.621	Amanda Taylor	$2b$12$uNOjLn4wRf6mRv3rSpl.5eNZQ9GSfoI6zz/Mu1f3E5k2QmWPweH26
e12a9403-9e52-4bb6-8b0d-c2c80498686c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chris	Wilson	chris17b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-31T21:15:24.795Z", "totalVisits": 18, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 171, "weight": 88, "dateOfBirth": "1981-06-18T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9844620378", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:24.796	2025-08-15 21:15:24.796	Chris Wilson	$2b$12$xdDOXuxnS4HEZieiFtQ7pO.45.FNTp64vPYkwqocze3tULfKlpj86
fddd6a86-ad1c-46a9-ad42-a14899bc45f0	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Nicole	Johnson	nicole18b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-27T21:15:24.981Z", "totalVisits": 156, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 189, "weight": 69, "dateOfBirth": "1982-05-14T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9716965131", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:24.982	2025-08-15 21:15:24.982	Nicole Johnson	$2b$12$AgHj01S2KXzE2/oZ0ytG0euvjGx0LkUAXEkRxWKWo/XmFAdhVFSK.
16b625c7-5530-4ceb-8c8e-91d66a653f52	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Brandon	Miller	brandon19b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:25.163Z", "totalVisits": 50, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 179, "weight": 81, "dateOfBirth": "1990-12-28T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Miller", "phone": "+63 9881432743", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:25.164	2025-08-15 21:15:25.164	Brandon Miller	$2b$12$n5LcIMmB8mtBb8GLKnMm5eGvKgfV914zHGPv5JXdzkJYNOWu8OxFa
5defd169-d762-49f3-bb8d-0efdceed53ac	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Stephanie	Jones	stephanie20b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-30T21:15:25.345Z", "totalVisits": 132, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 189, "weight": 93, "dateOfBirth": "2005-08-20T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Jones", "phone": "+63 9413578089", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:25.346	2025-08-15 21:15:25.346	Stephanie Jones	$2b$12$qpAK7vxEJqOeVy4rKjPiQ.K9qZHnN14dHc42M6seeuaacnf3N0Fx6
4597f4c8-2e9f-4b7b-8e5c-565df03c6c3c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Kevin	Chen	kevin21b1@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:25.530Z", "totalVisits": 95, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 150, "weight": 51, "dateOfBirth": "1991-07-13T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9707723597", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:25.532	2025-08-15 21:15:25.532	Kevin Chen	$2b$12$BV7E9Hcw6d395jRSVnrEK.g5olpH4PasICABLYqLZlWxoJtUOwHyW
8fac08ba-d78e-4d57-9b18-52b45d41efcf	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Manager2	Santos	manager2@chakara.com	\N	MANAGER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:25.721	2025-08-15 21:15:25.721	Manager2 Santos	$2b$12$.32sZFkDPGxtxNXg0F0Q7.sZvhRS2qEfGzY6ris5vjTS3A4gNbze2
ca48b462-bbd8-4d93-a7fd-22b8fea6cce7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Staff1	Branch2	staff21@chakara.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:25.894	2025-08-15 21:15:25.894	Staff1 Branch2	$2b$12$qCqdXlOB9d/ofvscec2nJOJ9lj7FlvWCNmh8EYs1DjarNHI72HM2u
ab486116-eb40-45de-b725-2cd6362f7c78	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Staff2	Branch2	staff22@chakara.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:26.067	2025-08-15 21:15:26.067	Staff2 Branch2	$2b$12$m/Z64KzJI/7uqdX5dDLbOOOtu8t5i9evt8IBUzsdXXtmyqeXsDr/6
5ea148ca-2a67-4b8d-91d3-f1de3d6bbd7a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	John	Doe	john1b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-29T21:15:26.248Z", "totalVisits": 184, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 160, "weight": 94, "dateOfBirth": "1998-01-11T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Doe", "phone": "+63 9237096091", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:26.25	2025-08-15 21:15:26.25	John Doe	$2b$12$pIz6OZ6UT3lF1L7f2m4P/eNq4Nz2Thwa1pQ9GmOjz89F7DJNc1qDS
ee3f7e0d-c0d0-4669-a68a-48be3aaad08b	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jane	Smith	jane2b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:26.430Z", "totalVisits": 34, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 176, "weight": 46, "dateOfBirth": "2006-05-01T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Smith", "phone": "+63 9106741585", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:26.431	2025-08-15 21:15:26.431	Jane Smith	$2b$12$uuGk.QTmf8Q5GDxWu/mgLeWfrUghGwT9A0grYiNdBtQ/1ccdGL1S2
7c7b5744-de44-4444-9f89-744ac7610479	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Mike	Johnson	mike3b2@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-27T21:15:26.607Z", "totalVisits": 162, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 159, "weight": 97, "dateOfBirth": "1988-09-07T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9781663319", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:26.608	2025-08-15 21:15:26.608	Mike Johnson	$2b$12$1ufFhfN2gHp6rIEmrOfBY.XMA2aIezD.wxzcxXoIu83i1y98Bh5Dm
859d77d6-2632-4669-8bc2-85a36e21600d	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Sarah	Wilson	sarah4b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-31T21:15:26.789Z", "totalVisits": 136, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 181, "weight": 66, "dateOfBirth": "1984-12-06T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9572879985", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:26.79	2025-08-15 21:15:26.79	Sarah Wilson	$2b$12$.Do012pLRjb3r1wO/PCrnuskfJbNY2fVugk3eiUFmV2Nq9ZHKLZju
10c7b2fe-820b-474a-a7ed-6b2224a60e52	d9e2fdf8-6b16-4340-97ec-5eace22acc57	David	Chen	david5b2@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-30T21:15:26.973Z", "totalVisits": 132, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 176, "weight": 65, "dateOfBirth": "2007-09-25T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9619555380", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:26.974	2025-08-15 21:15:26.974	David Chen	$2b$12$Q7DHxb2IN4zYUdGcwGLSnO6Pqdt8GVu/jxnf2pqEE8XmC0kQpk2PG
50730399-c746-4588-9db6-1874648c9b0e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Emily	Rodriguez	emily6b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-12T21:15:27.156Z", "totalVisits": 82, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 154, "weight": 51, "dateOfBirth": "1981-06-26T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Rodriguez", "phone": "+63 9956091112", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:27.157	2025-08-15 21:15:27.157	Emily Rodriguez	$2b$12$W/gx1G0i4NpoMSeFFkKV..DoJNss4xYdI5pSYDeaCzW7c50qee0pe
41f2b890-95b7-4c88-a143-459fcbbab863	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Carlos	Martinez	carlos7b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-26T21:15:27.338Z", "totalVisits": 169, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 162, "weight": 98, "dateOfBirth": "2004-06-03T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Martinez", "phone": "+63 9491854968", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:27.339	2025-08-15 21:15:27.339	Carlos Martinez	$2b$12$1jU0E8DhwunNiP9AwFOqT.g3UaVQanqok9xn1QTnOrwyi8TV0bavu
5e64e217-26b5-4748-b30a-43d59f3ce3b5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Lisa	Wang	lisa8b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-03T21:15:27.525Z", "totalVisits": 68, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 159, "weight": 63, "dateOfBirth": "1987-11-18T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Wang", "phone": "+63 9149298329", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:27.526	2025-08-15 21:15:27.526	Lisa Wang	$2b$12$fh/EMv1Vtw23fSy57QZ5O.w2fUVDkT0comvpZRVGv2wGzgIGvhTxu
ef905a18-7be2-440b-a3e9-89b1f94959e5	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Tom	Anderson	tom9b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-19T21:15:27.708Z", "totalVisits": 66, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 181, "weight": 55, "dateOfBirth": "1995-04-13T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Anderson", "phone": "+63 9144999242", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:27.709	2025-08-15 21:15:27.709	Tom Anderson	$2b$12$erxYkTtwM.6l4CYioch2FOGU5O9Pma0HbWtK5T/a/i3YzmTBdV3Zu
c072b241-12dd-4215-819d-7e22ba74a8c6	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Anna	Garcia	anna10b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-19T21:15:27.898Z", "totalVisits": 95, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 155, "weight": 98, "dateOfBirth": "1991-09-02T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Garcia", "phone": "+63 9564604037", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:27.899	2025-08-15 21:15:27.899	Anna Garcia	$2b$12$N6q7jeakaYjXlnqu2UsNmOu.LNAge0s4HL/6JQ75p44ZUYdXtZtE.
0724e47d-dcf1-4de8-b832-48dd78c8ba58	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Robert	Kim	robert11b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:28.094Z", "totalVisits": 61, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 187, "weight": 50, "dateOfBirth": "2000-07-10T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Kim", "phone": "+63 9134560699", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:28.095	2025-08-15 21:15:28.095	Robert Kim	$2b$12$HGShuGGGs4EiZW3vyRMv6.pg8R8RgRzHv9TwcP8TIPJEkoC8ocDIy
6232bf09-1929-46e9-86dd-73fee1e51308	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jennifer	Lopez	jennifer12b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:28.281Z", "totalVisits": 13, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 164, "weight": 78, "dateOfBirth": "2000-10-17T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Lopez", "phone": "+63 9737093400", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:28.282	2025-08-15 21:15:28.282	Jennifer Lopez	$2b$12$e2iZHg/DDUfYS6/etVOFweHhgv9Xn/.sbHyyVItDYOcKTowmWaHmy
48891e1a-6049-4ed8-88a4-1315969f47bf	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Michael	Brown	michael13b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-04T21:15:28.463Z", "totalVisits": 34, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 167, "weight": 64, "dateOfBirth": "1990-04-21T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Brown", "phone": "+63 9700737349", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:28.464	2025-08-15 21:15:28.464	Michael Brown	$2b$12$kCHjGwb2FoIHeGndXO8WyOQYgWiB4Qb0ga5KKjPtsjHVHT3FQNNbG
eceffe21-0f38-4e3b-a22a-c7c2ae268c7f	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jessica	Davis	jessica14b2@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:28.645Z", "totalVisits": 207, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 165, "weight": 64, "dateOfBirth": "1980-01-26T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Davis", "phone": "+63 9116192708", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:28.646	2025-08-15 21:15:28.646	Jessica Davis	$2b$12$FOBH7zFuO8bm9eLWYjLiCOwo4tWtGrc44MNUeat3XhuuDOZfQP8bS
9ef87d13-3400-4719-a5c2-3e132410eeef	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Daniel	Lee	daniel15b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-25T21:15:28.827Z", "totalVisits": 113, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 163, "weight": 68, "dateOfBirth": "2001-05-24T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Lee", "phone": "+63 9407545546", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:28.828	2025-08-15 21:15:28.828	Daniel Lee	$2b$12$NsNnEujBc1HOZWK/kIc5N.a9ZFV36Jw8VkkobtjbE144tJHTUOYqi
52da20cd-a142-44f0-899e-58fc55cc66ff	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Amanda	Taylor	amanda16b2@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-17T21:15:29.009Z", "totalVisits": 191, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 157, "weight": 67, "dateOfBirth": "1987-09-02T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Taylor", "phone": "+63 9532890824", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:29.01	2025-08-15 21:15:29.01	Amanda Taylor	$2b$12$j9jAXjis5vH5DLEoVOWDzuOCLGc9O7OMcsXA7aLTzbFkwll.5N.1i
698bb930-e4eb-46e1-85d6-0b1b0ba5761e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chris	Wilson	chris17b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-12T21:15:29.191Z", "totalVisits": 207, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 161, "weight": 72, "dateOfBirth": "1994-03-28T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9595261460", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:29.192	2025-08-15 21:15:29.192	Chris Wilson	$2b$12$bGyhjgb/61VXKajU7o3eZONYpiES3wVzcSuFvnCGLqfC.YvjAyW3O
06af4d42-3e87-4dad-aa28-ee1b7b3897c9	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Nicole	Johnson	nicole18b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:29.373Z", "totalVisits": 10, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 175, "weight": 54, "dateOfBirth": "1993-05-23T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9747318232", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:29.374	2025-08-15 21:15:29.374	Nicole Johnson	$2b$12$JhhOv53bZTP0bbQ332qqYuyRk32l6AVQJwPe6GxL5E5Q2GT5Hzhi.
48d488c3-0fcd-4b71-809c-191bbc258e0f	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Brandon	Miller	brandon19b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-02T21:15:29.556Z", "totalVisits": 89, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": ["None"], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 170, "weight": 74, "dateOfBirth": "1980-04-02T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Miller", "phone": "+63 9528942447", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:29.558	2025-08-15 21:15:29.558	Brandon Miller	$2b$12$CZJYb.SHeXEy0LlMT9ZnVeWA6U6s4zoDnXzBwJf5Vr3chZ3AvoEsu
cf9b15ae-9323-4ea9-a3e8-e8d9a3218abe	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Stephanie	Jones	stephanie20b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-20T21:15:29.738Z", "totalVisits": 22, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 169, "weight": 82, "dateOfBirth": "2007-03-04T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Jones", "phone": "+63 9405347124", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:29.739	2025-08-15 21:15:29.739	Stephanie Jones	$2b$12$KfVmYSQGu2PJaQ/AkJTwZegbV6A9D4WXn9ySKuAQ3z/mvg.aStzOC
1b2b2615-4838-4bac-ab4b-57c279a62b05	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Kevin	Chen	kevin21b2@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-19T21:15:29.923Z", "totalVisits": 143, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 155, "weight": 99, "dateOfBirth": "2006-11-22T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9655992527", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:29.924	2025-08-15 21:15:29.924	Kevin Chen	$2b$12$HYDGjTs1s2IPnqyP8IBb5eLymZ/6UUVL13YcBC5aXMFYFfpYQApAK
1896ee49-7e84-408a-a955-8ff335544891	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Rachel	Green	rachel22b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-05T21:15:30.105Z", "totalVisits": 162, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 179, "weight": 89, "dateOfBirth": "1982-05-13T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Green", "phone": "+63 9429241653", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:30.106	2025-08-15 21:15:30.106	Rachel Green	$2b$12$s/GJEnN0bv3L13fz8C04lOyqxbuK5pdqIbZXdqb/cl3b0GcqmKZcu
3d11dce9-9336-413d-931f-f82ee9fecc8a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Anthony	White	anthony23b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-02T21:15:30.291Z", "totalVisits": 31, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 176, "weight": 63, "dateOfBirth": "1997-07-15T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency White", "phone": "+63 9767958437", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:30.292	2025-08-15 21:15:30.292	Anthony White	$2b$12$9Ds3rxql2oo7HGLdG.0hO.tG.PoQb2y1PUK6PnxOaCDcu3Fx3Uiri
416ed71f-e7f1-4f6b-9691-924f830d6904	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Michelle	Thompson	michelle24b2@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-12T21:15:30.472Z", "totalVisits": 11, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 161, "weight": 61, "dateOfBirth": "1991-12-27T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Thompson", "phone": "+63 9515896054", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:30.473	2025-08-15 21:15:30.473	Michelle Thompson	$2b$12$BV0CCAWHHK5GnGSDcuCEu.5WUVcI/FIekMhNMPGvwqT8QU52ZcoSW
f82a06f6-e805-461b-94a2-c2ce6a9e9c91	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jason	Park	jason25b2@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-08-11T21:15:30.657Z", "totalVisits": 28, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 151, "weight": 47, "dateOfBirth": "2008-12-21T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Park", "phone": "+63 9401305423", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:30.658	2025-08-15 21:15:30.658	Jason Park	$2b$12$hb6eKGcoN4c1IVlAkRmB8OPFN9mjP.e8lGqqJNP1ENGwy9TA4opAi
3a2d3ece-5d2b-47b7-bbf2-c685631d7f2a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Manager3	Santos	manager3@chakara.com	\N	MANAGER	t	\N	\N	\N	\N	\N	2025-08-15 21:15:30.846	2025-08-15 21:15:30.846	Manager3 Santos	$2b$12$Sb1HXpVKZ4dc9/TlALIteuGaeteYEcMcpI8tsNmHeymjUGSvzmNou
6e207a81-7228-4ebf-9745-5f22bf18fad3	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Staff1	Branch3	staff31@chakara.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:31.009	2025-08-15 21:15:31.009	Staff1 Branch3	$2b$12$EVTG4IgxfP4/VEUUHFzYj.P0.z.ptLXxASinVEEnvLsZHlvZdS6Oi
e5821bc4-aa6c-4707-ac63-7256285248bb	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Staff2	Branch3	staff32@chakara.com	\N	STAFF	t	\N	\N	\N	\N	\N	2025-08-15 21:15:31.181	2025-08-15 21:15:31.181	Staff2 Branch3	$2b$12$VQ8hBLlDomFcPLYbQAttHOv4aoq6MKqxbW5q0HBr8kRZwO1weg.MK
541a91d9-0241-41f9-9bed-a7cab725a7d7	d9e2fdf8-6b16-4340-97ec-5eace22acc57	John	Doe	john1b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-20T21:15:31.362Z", "totalVisits": 85, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 179, "weight": 61, "dateOfBirth": "1982-09-02T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Doe", "phone": "+63 9872480125", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:31.363	2025-08-15 21:15:31.363	John Doe	$2b$12$46/P6Oka5ZQXPKlqf40NhuNzI6xSbCKoBiDZfn.eyYhr820vpqpqO
bb4e114c-2d7b-476a-bbf3-67c50896fb2e	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jane	Smith	jane2b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-07T21:15:31.544Z", "totalVisits": 175, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 177, "weight": 49, "dateOfBirth": "2004-09-06T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Smith", "phone": "+63 9880575049", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:31.545	2025-08-15 21:15:31.545	Jane Smith	$2b$12$.br1JQ/Zk6T1CNaRhNdL6ee9OMHGpmOG/p13pnPa1tt8jFrwqFdiC
5100d597-560d-489d-af2d-235076f30841	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Mike	Johnson	mike3b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:31.725Z", "totalVisits": 92, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 152, "weight": 99, "dateOfBirth": "2009-01-07T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9283591703", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:31.726	2025-08-15 21:15:31.726	Mike Johnson	$2b$12$XPepeBaApV.36upnsYOe5.VXm68rVS0g5thz1iNFbllNfIJcK9LKG
e915fb04-b580-40ae-8a35-7eb07949c507	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Sarah	Wilson	sarah4b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:31.909Z", "totalVisits": 208, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 177, "weight": 67, "dateOfBirth": "1988-07-12T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9636725134", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:31.91	2025-08-15 21:15:31.91	Sarah Wilson	$2b$12$Fe1QztIRrKN1ryxM2nGRxe7fbdqqyKP7s9aS2A6jYFb5Mnwmq5IhO
bbe614ae-2383-4f72-90af-e4f59722eb36	d9e2fdf8-6b16-4340-97ec-5eace22acc57	David	Chen	david5b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-31T21:15:32.098Z", "totalVisits": 46, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "FEMALE", "height": 186, "weight": 65, "dateOfBirth": "2005-03-20T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Chen", "phone": "+63 9520594239", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:32.099	2025-08-15 21:15:32.099	David Chen	$2b$12$/LD6qxY7o6eaqNW3waZFyeB5lHySGmzks9ie9zKLCR.PSG1bC1cZy
4fe8a88d-32f5-47d9-bef2-73f69b5d7491	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Emily	Rodriguez	emily6b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:32.279Z", "totalVisits": 15, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 173, "weight": 82, "dateOfBirth": "1985-07-03T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Rodriguez", "phone": "+63 9491113336", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:32.28	2025-08-15 21:15:32.28	Emily Rodriguez	$2b$12$28Ty7d5baLO5XjzK4THzfuVoTxVZHT/5/x4iv57CvihArzCxxOzCO
eeae7ae6-a1ff-4ace-aa80-6ff1065add60	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Carlos	Martinez	carlos7b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-21T21:15:32.462Z", "totalVisits": 36, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 187, "weight": 60, "dateOfBirth": "2003-04-01T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Martinez", "phone": "+63 9822217910", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:32.463	2025-08-15 21:15:32.463	Carlos Martinez	$2b$12$Jo.xY/4iLVGMJtIlHabtWuu2Cju6on4vC2rx6WgWtIXv2Xl2eFOxq
c5b213ab-6caf-4b7c-ab4c-909ea92117fe	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Lisa	Wang	lisa8b3@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-21T21:15:32.647Z", "totalVisits": 49, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 156, "weight": 99, "dateOfBirth": "1982-08-14T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Wang", "phone": "+63 9162484280", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:32.648	2025-08-15 21:15:32.648	Lisa Wang	$2b$12$qvC3tbPn34mxre3bmRtND.IVxe7/MLJhnwcS6sfnNpoIqZIDsu83G
34773a75-10d7-4371-a9af-40cfaccb78dc	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Tom	Anderson	tom9b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:32.846Z", "totalVisits": 205, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "FEMALE", "height": 181, "weight": 89, "dateOfBirth": "1995-09-06T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Anderson", "phone": "+63 9190657017", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:32.847	2025-08-15 21:15:32.847	Tom Anderson	$2b$12$1dcS6svHhZhfDzaaYCUT7ui9V3VY750Z1cnamildTkoy3Ezxr6/Ia
a541f0b2-43c6-471a-823c-7ed166b3095c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Anna	Garcia	anna10b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-13T21:15:33.044Z", "totalVisits": 44, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 154, "weight": 80, "dateOfBirth": "1986-08-24T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Garcia", "phone": "+63 9642121283", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:33.045	2025-08-15 21:15:33.045	Anna Garcia	$2b$12$f1gWN/xiZtvo42He488vzuQA8ixD1TKfDBG2uP3Y8aZkv.892dyu6
67214f3c-db70-4264-8958-d659939a2d4c	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Robert	Kim	robert11b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-24T21:15:33.242Z", "totalVisits": 182, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 163, "weight": 73, "dateOfBirth": "1990-03-11T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Kim", "phone": "+63 9790385524", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:33.243	2025-08-15 21:15:33.243	Robert Kim	$2b$12$hxJstbtWBsBselbgMW0gEeXyxKUnydbPQBUVSxvCxSkLIHf/ETRFm
0d76c3a8-b881-4273-829e-eca4280cf0cb	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jennifer	Lopez	jennifer12b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-18T21:15:33.437Z", "totalVisits": 16, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": false, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 178, "weight": 53, "dateOfBirth": "1981-08-03T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Lopez", "phone": "+63 9621132744", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:33.439	2025-08-15 21:15:33.439	Jennifer Lopez	$2b$12$ipbVXhEdi55pyUsUH4qh0OCyn.wQaItNfHcKwWwqsUrh3EgWa.BY2
0dd97c34-d21b-4d40-9a2d-44bb5ca372b1	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Michael	Brown	michael13b3@chakara.com	\N	GYM_MEMBER	f	\N	\N	{"attendance": {"lastVisit": "2025-07-23T21:15:33.644Z", "totalVisits": 27, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 172, "weight": 85, "dateOfBirth": "1985-02-20T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Brown", "phone": "+63 9222171260", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:33.645	2025-08-15 21:15:33.645	Michael Brown	$2b$12$GzJBgQYh9xf9ksqSx4IYseNxAINnUup7kOB51taV6eqB3Rwr5SFMG
9bf15681-7144-4a2b-bdf7-cea7da068f47	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Jessica	Davis	jessica14b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-18T21:15:33.852Z", "totalVisits": 62, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 155, "weight": 88, "dateOfBirth": "1988-07-17T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Davis", "phone": "+63 9983921641", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:33.853	2025-08-15 21:15:33.853	Jessica Davis	$2b$12$cWg2fpJ4cSPnAUztqPRuWOatyYCJd4ItpfOVlr.nCjkSqvI6EMJ1a
88951605-b502-4327-b8b7-8f0574dc7141	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Daniel	Lee	daniel15b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-14T21:15:34.046Z", "totalVisits": 56, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": ["None"]}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Morning"}, "personalInfo": {"gender": "MALE", "height": 164, "weight": 77, "dateOfBirth": "1995-11-22T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Lee", "phone": "+63 9321306578", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:34.047	2025-08-15 21:15:34.047	Daniel Lee	$2b$12$/o6O8cLXv3pz2g9Ojuwcv.J99xSRT2EFNCrrs3LrnQWUtY/XlWCvO
d3e8af3e-565b-4730-b4f1-8aa39dd4c4ce	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Amanda	Taylor	amanda16b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-22T21:15:34.251Z", "totalVisits": 123, "averageVisitsPerWeek": 2}, "healthInfo": {"allergies": [], "fitnessLevel": "Beginner", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 187, "weight": 73, "dateOfBirth": "1997-01-02T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Taylor", "phone": "+63 9633472322", "relationship": "Spouse"}}}	\N	\N	2025-08-15 21:15:34.253	2025-08-15 21:15:34.253	Amanda Taylor	$2b$12$X.P9611jw/1chuCWbAT7qud8xz1BGC9I9c3/jhXh/i9xc/9lq5BxW
87f2519b-93a2-4723-9bed-5ece8cba43c9	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Chris	Wilson	chris17b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-17T21:15:34.461Z", "totalVisits": 198, "averageVisitsPerWeek": 4}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Cardio", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 153, "weight": 85, "dateOfBirth": "1980-08-22T00:00:00.000Z", "fitnessGoals": "Strength Training", "emergencyContact": {"name": "Emergency Wilson", "phone": "+63 9277216042", "relationship": "Sibling"}}}	\N	\N	2025-08-15 21:15:34.462	2025-08-15 21:15:34.462	Chris Wilson	$2b$12$J8CbRwWWErL9KZDMnrAzX.Bkk27U36d7wuN/Jjr1z3sqpRprnMIMa
7ff92cd0-7706-4c5c-a825-469accf3867a	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Nicole	Johnson	nicole18b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-10T21:15:34.676Z", "totalVisits": 206, "averageVisitsPerWeek": 1}, "healthInfo": {"allergies": [], "fitnessLevel": "Intermediate", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": false, "email": false}, "favoriteEquipment": "Weights", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "MALE", "height": 162, "weight": 54, "dateOfBirth": "2007-08-06T00:00:00.000Z", "fitnessGoals": "Fitness Maintenance", "emergencyContact": {"name": "Emergency Johnson", "phone": "+63 9549808655", "relationship": "Parent"}}}	\N	\N	2025-08-15 21:15:34.677	2025-08-15 21:15:34.677	Nicole Johnson	$2b$12$NOufv5cbx1/0BThBpS7B6utiBoVAOduioM683RW6MbkMxUz5grHT.
cbf3fb80-71db-4137-96ae-690e6850d123	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Brandon	Miller	brandon19b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-08-07T21:15:34.871Z", "totalVisits": 45, "averageVisitsPerWeek": 5}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": false, "push": true, "email": false}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Afternoon"}, "personalInfo": {"gender": "MALE", "height": 160, "weight": 96, "dateOfBirth": "1988-11-25T00:00:00.000Z", "fitnessGoals": "Weight Loss", "emergencyContact": {"name": "Emergency Miller", "phone": "+63 9237150429", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:34.872	2025-08-15 21:15:34.872	Brandon Miller	$2b$12$vaW38p/7XTyYH4yCH.RFt.F6m9ytDCGsb9J5R4fj0X/E8J8xwxNYW
d231ee48-9bdf-4715-ae5b-438a67e59930	d9e2fdf8-6b16-4340-97ec-5eace22acc57	Stephanie	Jones	stephanie20b3@chakara.com	\N	GYM_MEMBER	t	\N	\N	{"attendance": {"lastVisit": "2025-07-26T21:15:35.078Z", "totalVisits": 72, "averageVisitsPerWeek": 3}, "healthInfo": {"allergies": [], "fitnessLevel": "Advanced", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "Functional Training", "preferredWorkoutTime": "Evening"}, "personalInfo": {"gender": "FEMALE", "height": 169, "weight": 89, "dateOfBirth": "1988-01-26T00:00:00.000Z", "fitnessGoals": "Muscle Gain", "emergencyContact": {"name": "Emergency Jones", "phone": "+63 9956291082", "relationship": "Friend"}}}	\N	\N	2025-08-15 21:15:35.079	2025-08-15 21:15:35.079	Stephanie Jones	$2b$12$erwdRNoR1cHGk.j6Iv/paO7t53o.ha1k87VS5pD7/whmzY5d5ewHC
f82d6622-da5d-4c7a-b471-5d586e6d58f9	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Test	Member	testmember@muscle-mania.com	\N	GYM_MEMBER	f	\N	\N	\N	\N	\N	2025-08-16 03:36:35.758	2025-08-16 03:38:27.025	\N	\N
2875895a-da05-4fe7-bec3-2d3a1c004a4f	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Jane	Smith	testmember2@muscle-mania.com	\N	GYM_MEMBER	t	\N	\N	\N	\N	\N	2025-08-16 03:37:15.677	2025-08-16 05:52:10.764	\N	\N
25a78382-a9a5-48b4-9cb0-e5cb15331193	111d5c39-4d8f-4d67-bfeb-8bf738ee71b4	Sawyer updated	Cooke	logitip@mailinator.com	\N	GYM_MEMBER	t	\N	\N	{"healthInfo": {"allergies": [], "fitnessLevel": "", "medicalConditions": []}, "preferences": {"notifications": {"sms": true, "push": true, "email": true}, "favoriteEquipment": "", "preferredWorkoutTime": ""}, "personalInfo": {"gender": "", "height": null, "weight": null, "dateOfBirth": null, "fitnessGoals": "", "emergencyContact": {"name": "", "phone": "", "relationship": ""}}}	\N	\N	2025-08-16 06:19:14.328	2025-08-16 06:25:24.126	\N	\N
\.


--
-- Data for Name: UserBranch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserBranch" (id, "userId", "branchId", "accessLevel", "isPrimary", permissions, "createdAt", "updatedAt") FROM stdin;
e8cc3d49-a567-4ce9-b4a0-4239fb86b5a8	4427ab80-2b56-4489-9cd7-95ec53388a68	552c8390-97a6-4866-bc39-1f7fb1c21344	MANAGER_ACCESS	f	\N	2025-08-15 21:15:09.256	2025-08-15 21:15:09.256
0a16f735-6cbb-4888-9661-c54facff7d93	b8493cbd-a496-4218-8edb-557f13a8c94b	552c8390-97a6-4866-bc39-1f7fb1c21344	STAFF_ACCESS	f	\N	2025-08-15 21:15:09.261	2025-08-15 21:15:09.261
d0df6772-0bc6-4685-8f7e-129d96a3dd9a	6bf085ab-6fca-47e9-abd8-d654ad2bd6f6	552c8390-97a6-4866-bc39-1f7fb1c21344	STAFF_ACCESS	f	\N	2025-08-15 21:15:09.264	2025-08-15 21:15:09.264
d66b2278-5324-45bf-bc31-5a31d5f62832	d9b274b3-4612-4080-afe1-fca9f2676f5b	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:09.459	2025-08-15 21:15:09.459
238c10cc-7509-4933-ad73-78a958e3f7ab	e2b904c8-4390-407b-9b43-ead7f4b5d630	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:09.638	2025-08-15 21:15:09.638
37762ddb-bb34-4a36-896f-4004d098ea0e	06f6b164-7dfd-4ad7-88c0-c9ae71aefd87	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:09.825	2025-08-15 21:15:09.825
3bb604c4-8da1-423b-a33c-5bc64d55788c	2cdcdde8-2186-4b3b-a85b-0425fceaa4cb	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:10.013	2025-08-15 21:15:10.013
cab5ba13-1d3f-456d-90cd-cf79c3cf7898	993ff5fe-cf19-448b-af59-ae2f58e326da	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:10.196	2025-08-15 21:15:10.196
7663a279-5e24-4394-894c-431702044d3a	13fae61b-191a-40e9-b101-7eef30491653	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:10.38	2025-08-15 21:15:10.38
b30a1c0a-4356-4fcf-89aa-47704c339823	9ea655bd-4bc9-40bc-887c-9087e6678658	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:10.568	2025-08-15 21:15:10.568
5c9d88af-d9e6-43aa-9801-e56af76649bd	e1a36b51-7d48-49fd-8306-3661f50de347	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:10.756	2025-08-15 21:15:10.756
e424c15c-8084-4d1a-8cdf-e29b5de92863	a5876288-ddff-4c74-878f-5b9762e08aab	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:10.938	2025-08-15 21:15:10.938
53468fe0-d23a-4211-b820-c6a698933ed3	585e7aeb-f15b-40ed-baad-2d6bc65022c1	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:11.121	2025-08-15 21:15:11.121
e0f1128f-89b5-4941-9d5d-e745434eacb1	1a548a32-8f15-4374-bb1d-4423936da4c6	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:11.298	2025-08-15 21:15:11.298
35474380-333e-48ab-a5e6-2a85ca55a319	88f7822d-7d0f-4086-bf04-c060ac7be4bc	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:11.48	2025-08-15 21:15:11.48
6732f3c0-f37e-4c6a-9cca-0cf806e7a91b	639a83aa-f46f-4606-88af-55a4dd02c426	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:11.661	2025-08-15 21:15:11.661
777cbc0a-73b9-49b3-84d8-7b28d031577a	e3841aaa-cd05-4920-b236-76b6a22a683d	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:11.845	2025-08-15 21:15:11.845
65830039-a630-42b5-96ef-ee6d4eeb6d7d	5a589fc7-f6e9-4ad5-8823-4e1e09e2d009	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:12.032	2025-08-15 21:15:12.032
61dfdbe6-0bf2-4ed1-b68f-294589d46107	40eb8a4b-f4aa-4583-b961-a68b6077638c	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:12.214	2025-08-15 21:15:12.214
f28f6632-1627-4ae0-9726-96e639a769cb	d1a1c54a-cc81-4748-8bf0-749e288d1513	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:12.399	2025-08-15 21:15:12.399
c4991463-9343-4f3e-a741-ba1159635bba	6ee2317c-d4db-4ab1-811a-5a0518170334	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:12.58	2025-08-15 21:15:12.58
101edfdc-7405-47a7-879e-689f7ba3acf4	7b4241a4-d346-4ce6-9a5f-5b65d2898b53	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:12.753	2025-08-15 21:15:12.753
84def5ca-3d00-4d1d-ad76-32e163eb63e8	d4340de3-112d-4c75-8c34-71fadc980e2e	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:12.937	2025-08-15 21:15:12.937
8139bc58-0b5f-4075-a218-4f90fc415602	5530a1b4-2b3d-4db3-af3a-ca59a0ba7b31	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:13.118	2025-08-15 21:15:13.118
600f1f9d-55e9-46df-bdd5-b901c9c54205	1f7502dd-2a0f-4131-8300-affd8822c509	552c8390-97a6-4866-bc39-1f7fb1c21344	READ_ONLY	f	\N	2025-08-15 21:15:13.299	2025-08-15 21:15:13.299
900e6382-45af-4616-af99-b64ba047a71b	e9315acf-58fa-4e64-9117-6e040924692c	9e8006c1-435d-4233-a1fa-b6a354370b7a	MANAGER_ACCESS	f	\N	2025-08-15 21:15:13.83	2025-08-15 21:15:13.83
ccfbe35f-3c75-412e-829a-f4fe2e30f4fd	bf1bfffa-1df1-440b-b39f-23364db0d7be	9e8006c1-435d-4233-a1fa-b6a354370b7a	STAFF_ACCESS	f	\N	2025-08-15 21:15:13.833	2025-08-15 21:15:13.833
a6af5d1e-166a-4c25-916a-1075331d6dc7	cd6b0c4f-7507-4ba6-a977-c9d4d5fef345	9e8006c1-435d-4233-a1fa-b6a354370b7a	STAFF_ACCESS	f	\N	2025-08-15 21:15:13.836	2025-08-15 21:15:13.836
1135ccb6-d391-411e-aaff-8245c99e0d93	8ecf2bb7-4fdb-41c7-b615-8ed01690d6a6	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:14.012	2025-08-15 21:15:14.012
94c022da-773d-4620-b858-b29053c96e0d	a63a6b34-9f04-4d0a-8ee8-48268bfe66a0	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:14.194	2025-08-15 21:15:14.194
c6e90a7d-04f2-4a90-ad7d-d83d53303f50	64ca15dc-77e0-4312-9a01-34c03133c013	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:14.377	2025-08-15 21:15:14.377
86a6273d-f466-43d3-a7c0-7a4be2212541	dc41b15c-9291-4f4d-9f3c-93d555c5ea9b	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:14.561	2025-08-15 21:15:14.561
9e4a9f1c-2606-4483-95d1-0e5633cdb98f	7c8ac662-a5f2-44a5-8751-e115855f49c6	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:14.744	2025-08-15 21:15:14.744
4e1586b0-2fe0-475d-a4c0-27592935185e	e0c9cf5b-bd38-47b5-b157-673087594195	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:14.919	2025-08-15 21:15:14.919
9f678d7a-b664-4611-9813-355146e69a5c	26cf28c0-fa6d-4a68-b300-c1b78b174e38	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:15.092	2025-08-15 21:15:15.092
94649f56-3e6e-4a91-8fe1-5c2ffb811a7f	bd3a1fdf-1b4a-4293-b0d7-6afecf284db1	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:15.273	2025-08-15 21:15:15.273
5d1155de-f355-4c9c-9728-18a6342f0a7c	a2d92660-477e-4804-a4ee-defa4fea6db6	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:15.455	2025-08-15 21:15:15.455
5455f807-cd2c-4520-82be-57a3a765aaaf	ed7b4704-9872-4e7f-a799-2a08a4694241	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:15.636	2025-08-15 21:15:15.636
79dd3ad6-2790-4a6f-a234-001b6d5dc041	f9e935d8-2de6-44fc-a2d4-d7f9a58a4224	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:15.82	2025-08-15 21:15:15.82
31305627-7db9-4cbc-91d7-5c59ac357f96	0f3f75a5-257a-4ecc-bd35-d9ce44e44510	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:16.011	2025-08-15 21:15:16.011
d5b32769-3b36-4f8b-b3d6-d212d44f511d	a782550d-3c55-4360-b04b-592f7fcb7251	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:16.193	2025-08-15 21:15:16.193
10f8fbb4-29c3-43c1-8626-e4f7862b647e	a44fd54f-c58d-447f-ada5-d5550dfac49a	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:16.383	2025-08-15 21:15:16.383
b0b0a8d4-4265-4009-8187-e3306b05d4d1	4f8cb99f-4027-4cbe-94c1-203953439e37	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:16.587	2025-08-15 21:15:16.587
58946476-21b4-4b59-b792-6847df58970f	0cf489e8-4901-48b5-95a3-b865c9ec4e7d	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:16.77	2025-08-15 21:15:16.77
e06e8c2b-2df1-4d29-8f0c-b01b99bf4dc1	b64c164b-200f-4fa2-b3ef-0fb8f1a2885b	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:16.947	2025-08-15 21:15:16.947
5b96b437-1a0d-476f-a623-da908ba53d1f	a23cee81-923d-4e29-8778-13a56088dacb	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:17.137	2025-08-15 21:15:17.137
6143d667-c04f-4434-8c24-cd6d536f7f3b	6041c766-6626-4b46-8a0c-1d29b464e6d3	9e8006c1-435d-4233-a1fa-b6a354370b7a	READ_ONLY	f	\N	2025-08-15 21:15:17.322	2025-08-15 21:15:17.322
2850b648-f33d-4435-bf2b-7a0f2f339f49	a039a171-caeb-48b4-bde4-52ab65c3c174	acfee35d-14de-4888-97f5-48d49726ba76	MANAGER_ACCESS	f	\N	2025-08-15 21:15:17.857	2025-08-15 21:15:17.857
38bbdc8d-4ee9-4d0c-acf0-1f4669ced5b7	54867cf0-3995-4173-912d-8212d6cb18e3	acfee35d-14de-4888-97f5-48d49726ba76	STAFF_ACCESS	f	\N	2025-08-15 21:15:17.861	2025-08-15 21:15:17.861
e3188d7f-2a26-46e0-a66a-b9ef1da1d7a4	36e54d67-fced-4e51-be2e-10b4edfe066a	acfee35d-14de-4888-97f5-48d49726ba76	STAFF_ACCESS	f	\N	2025-08-15 21:15:17.864	2025-08-15 21:15:17.864
506e29aa-0db4-4d1e-804e-4c0d75181f86	b29d347c-9ead-4449-ad79-3c6e87c24acc	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:18.047	2025-08-15 21:15:18.047
71cb6270-8fff-4041-bd5b-e7fb4069598c	6ff363cd-6c14-46f1-ae83-349ee293ea20	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:18.23	2025-08-15 21:15:18.23
f1fc902c-4d50-4ce6-a54f-2498710dcb47	4865da07-51ea-4bdc-8b92-be9772e6560f	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:18.405	2025-08-15 21:15:18.405
e1a11d3b-ef26-4aad-9995-90173207a431	294a9115-ad8c-4b7a-aaaa-bbe6ac9eb834	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:18.588	2025-08-15 21:15:18.588
e87ef0cf-e2e0-468a-89c8-272e9e120070	235d201b-9a65-4f56-be06-fb7707e7e26b	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:18.77	2025-08-15 21:15:18.77
127db377-0596-43b3-8146-c30118f84fb0	76a2b8f3-4285-488f-8802-443a7795c971	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:18.953	2025-08-15 21:15:18.953
8e3f99dc-af34-4624-80e3-079b8795dda6	795e3897-f051-4f99-bd3e-144e3eb75a2d	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:19.135	2025-08-15 21:15:19.135
f7fad73b-252b-4e1d-adb7-43bb6bb9903f	0a3ff09b-fb4f-48aa-834e-1f3242c71191	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:19.319	2025-08-15 21:15:19.319
47d88c4e-1312-4d6a-9d70-b5b411f8843b	bdfb52b4-4099-43b6-a5ad-e105d73ee9cd	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:19.502	2025-08-15 21:15:19.502
875b6cd1-ce4a-42cb-b896-c191a3e1ad5a	838c2609-41f0-4370-95f0-706698b35c2c	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:19.676	2025-08-15 21:15:19.676
d8712395-63f1-4b4c-9d43-d73c24c7ec0b	9dc6450b-37bd-489a-8053-ce0c673cf484	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:19.849	2025-08-15 21:15:19.849
e1b8bd29-b4e9-4aa3-ab2d-025bcf76c050	baafbac5-b320-4a5b-b113-4b332d15a351	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:20.022	2025-08-15 21:15:20.022
7281e104-6dc8-4901-9fb9-c08a6fd98ec2	9339893c-3a56-4e48-8613-8fd3962ed2da	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:20.196	2025-08-15 21:15:20.196
021f67cc-6848-4a71-a1b2-90533755c5c1	a6c57000-0c2c-4d31-83e6-e0244c497009	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:20.382	2025-08-15 21:15:20.382
85149de9-c5af-4199-84c0-44b0963da5e0	bda45883-e863-4814-bdcf-9554683c43b2	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:20.575	2025-08-15 21:15:20.575
acf7eb90-390f-4655-be58-c48add2b6c04	91c3108c-aa48-4b84-9bf3-d284889d4fa5	acfee35d-14de-4888-97f5-48d49726ba76	READ_ONLY	f	\N	2025-08-15 21:15:20.765	2025-08-15 21:15:20.765
da643692-725f-4a7c-be82-c2d9a8f71336	3420c898-0c22-4237-8b9e-494c379a4523	e54b9b90-9405-4549-8c20-ead4b2fc191e	MANAGER_ACCESS	f	\N	2025-08-15 21:15:21.508	2025-08-15 21:15:21.508
dda54cb1-158a-49d5-a7b7-a4c8b3dd089a	a5518138-61d8-492f-a0b4-59c98b795bb5	e54b9b90-9405-4549-8c20-ead4b2fc191e	STAFF_ACCESS	f	\N	2025-08-15 21:15:21.512	2025-08-15 21:15:21.512
11e9b120-87c2-40e6-8757-c4c1b0b1b17a	b6c8dcfe-9863-4927-92b1-25634cea90f9	e54b9b90-9405-4549-8c20-ead4b2fc191e	STAFF_ACCESS	f	\N	2025-08-15 21:15:21.514	2025-08-15 21:15:21.514
d44379b1-054d-465d-9091-020241574b8f	afa1faf3-db3d-489f-8893-d8839942fb3f	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:21.693	2025-08-15 21:15:21.693
12632fc4-bbab-4115-a9cd-02366fab7306	995c59db-a459-4a88-a75e-305c1ca41313	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:21.875	2025-08-15 21:15:21.875
51a18a9e-5cc9-457a-857b-79466bdd5851	6bf33357-06b2-4d2c-945b-8891389fb68b	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:22.061	2025-08-15 21:15:22.061
dbc7a56c-cdbf-42a8-88b0-5d09af290b71	8a02baab-c306-429e-b620-077e917badd0	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:22.246	2025-08-15 21:15:22.246
4d1ca2e4-a938-4ac1-96de-1a42310788d8	f09a2351-e775-4431-8b76-883f944dd3fd	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:22.421	2025-08-15 21:15:22.421
a99b4e39-d0d8-4c5b-a3b1-f08067ef0447	dfd3b910-7871-4e6e-a839-4590947b517d	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:22.608	2025-08-15 21:15:22.608
6b78a0cd-31c8-4bd1-a734-ea0f528bc0e4	699da01d-d578-41ec-b4ca-d0e46f6798f5	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:22.792	2025-08-15 21:15:22.792
8270833e-bae5-4e15-9bc4-30c4108dd62b	c74961d3-ba1c-4ee5-aeb2-44877ef69675	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:22.977	2025-08-15 21:15:22.977
0ff64c57-26a5-48e0-9b64-2f76f6053fe5	c888a561-f343-4903-8403-fa3e344700bf	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:23.166	2025-08-15 21:15:23.166
a59f7480-791e-48e3-bbe2-a54c1bf61a58	4c76499d-0a6e-483b-9abc-717b4719e48b	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:23.347	2025-08-15 21:15:23.347
6b694177-0e86-4faa-9724-268786f4bfd1	3a1b2349-5c38-410d-afe2-e00841274936	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:23.536	2025-08-15 21:15:23.536
a0767db4-f89a-4b5a-8e8a-e8e335916633	4053317b-c36e-4cfa-afc3-380077c8eeb1	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:23.732	2025-08-15 21:15:23.732
47637606-ea91-4d58-af9c-d74878905a27	e4624fb5-1793-4b5d-806e-491ebeec1583	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:23.927	2025-08-15 21:15:23.927
9e39f382-50dc-4f5e-a606-3a95ffe4aec9	b5712765-0812-49e4-a8f5-daa61a3f5791	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:24.183	2025-08-15 21:15:24.183
390a58ca-e9c3-4199-b3eb-6f0f1a10f848	3d65100b-25ab-46fd-b4a2-f1d4df263ca8	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:24.424	2025-08-15 21:15:24.424
f8631ac2-1e0c-46ea-8027-0b727baae3e4	bd53a564-62dc-4e71-b287-fbc4aa95ff45	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:24.632	2025-08-15 21:15:24.632
488b702c-0acf-4d54-81a9-cb5b018cfcb8	e12a9403-9e52-4bb6-8b0d-c2c80498686c	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:24.815	2025-08-15 21:15:24.815
5072783c-a2c9-4138-91b0-fe901fe28d44	fddd6a86-ad1c-46a9-ad42-a14899bc45f0	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:25.001	2025-08-15 21:15:25.001
565a2941-be19-4ca8-9a95-62d1266f6616	16b625c7-5530-4ceb-8c8e-91d66a653f52	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:25.183	2025-08-15 21:15:25.183
306601a9-c30a-4742-8e8d-a76ef7ae1ab6	5defd169-d762-49f3-bb8d-0efdceed53ac	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:25.368	2025-08-15 21:15:25.368
d3fc39b6-a58e-4d4c-ac91-0dd8f7f9b1b1	4597f4c8-2e9f-4b7b-8e5c-565df03c6c3c	e54b9b90-9405-4549-8c20-ead4b2fc191e	READ_ONLY	f	\N	2025-08-15 21:15:25.55	2025-08-15 21:15:25.55
c3332dd6-1cb3-4a7c-a38c-549fb12ee35f	8fac08ba-d78e-4d57-9b18-52b45d41efcf	3f1b2054-26d7-4895-84bb-0322ec7042b0	MANAGER_ACCESS	f	\N	2025-08-15 21:15:26.08	2025-08-15 21:15:26.08
aa1ce774-b12a-4301-b2e5-ad07c9430a39	ca48b462-bbd8-4d93-a7fd-22b8fea6cce7	3f1b2054-26d7-4895-84bb-0322ec7042b0	STAFF_ACCESS	f	\N	2025-08-15 21:15:26.083	2025-08-15 21:15:26.083
c3a23327-a8a6-46be-99c7-14578d55cb65	ab486116-eb40-45de-b725-2cd6362f7c78	3f1b2054-26d7-4895-84bb-0322ec7042b0	STAFF_ACCESS	f	\N	2025-08-15 21:15:26.086	2025-08-15 21:15:26.086
e934fa6b-5c7e-4c14-b058-4ba6261769a3	5ea148ca-2a67-4b8d-91d3-f1de3d6bbd7a	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:26.269	2025-08-15 21:15:26.269
005d9ffb-5c43-4c7a-a75e-8d859b1b903f	ee3f7e0d-c0d0-4669-a68a-48be3aaad08b	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:26.441	2025-08-15 21:15:26.441
e7426f9d-6d4e-4641-8b39-3751092f821e	7c7b5744-de44-4444-9f89-744ac7610479	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:26.627	2025-08-15 21:15:26.627
d7a101b4-a200-4051-a592-aed6052690da	859d77d6-2632-4669-8bc2-85a36e21600d	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:26.809	2025-08-15 21:15:26.809
07727eac-f8af-4c83-a32e-f34146a08fd3	10c7b2fe-820b-474a-a7ed-6b2224a60e52	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:26.994	2025-08-15 21:15:26.994
0f66d327-8d7c-4849-b55c-585f3f669028	50730399-c746-4588-9db6-1874648c9b0e	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:27.177	2025-08-15 21:15:27.177
2cab8ad2-aeee-431b-a620-62ee6db0718d	41f2b890-95b7-4c88-a143-459fcbbab863	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:27.362	2025-08-15 21:15:27.362
178f43ec-3cb4-48f6-8024-5c79f470e89e	5e64e217-26b5-4748-b30a-43d59f3ce3b5	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:27.546	2025-08-15 21:15:27.546
28132cc4-5c07-48ad-ac82-672535b26e2f	ef905a18-7be2-440b-a3e9-89b1f94959e5	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:27.721	2025-08-15 21:15:27.721
bb0409fe-fa87-4e1e-b3c8-c21867bbe251	c072b241-12dd-4215-819d-7e22ba74a8c6	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:27.919	2025-08-15 21:15:27.919
285f6bed-a727-4645-828e-74e4806c7b46	0724e47d-dcf1-4de8-b832-48dd78c8ba58	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:28.114	2025-08-15 21:15:28.114
3736b4c2-6f8b-4153-958f-7abe446b3d4c	6232bf09-1929-46e9-86dd-73fee1e51308	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:28.301	2025-08-15 21:15:28.301
088f644d-7cf6-46fa-93a1-806f54d19860	48891e1a-6049-4ed8-88a4-1315969f47bf	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:28.483	2025-08-15 21:15:28.483
d823d3ca-8da9-4237-a1d6-738251cee67c	eceffe21-0f38-4e3b-a22a-c7c2ae268c7f	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:28.665	2025-08-15 21:15:28.665
f246c020-3bc1-45eb-835c-28fdee2f5267	9ef87d13-3400-4719-a5c2-3e132410eeef	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:28.847	2025-08-15 21:15:28.847
441bfff2-f4b7-44b8-afd3-de579141edb3	52da20cd-a142-44f0-899e-58fc55cc66ff	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:29.029	2025-08-15 21:15:29.029
3698a08e-d14d-4f0c-b5ed-586c252e5a8d	698bb930-e4eb-46e1-85d6-0b1b0ba5761e	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:29.211	2025-08-15 21:15:29.211
50df2962-8d93-4b5c-a429-8688674490ba	06af4d42-3e87-4dad-aa28-ee1b7b3897c9	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:29.394	2025-08-15 21:15:29.394
7200cad8-8ca5-4ee0-991a-9cb87ec407a6	48d488c3-0fcd-4b71-809c-191bbc258e0f	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:29.577	2025-08-15 21:15:29.577
44cd1e27-b026-455a-b77d-5ed9c179313a	cf9b15ae-9323-4ea9-a3e8-e8d9a3218abe	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:29.759	2025-08-15 21:15:29.759
2dea7641-12f0-4e94-ae95-31443e7797f8	1b2b2615-4838-4bac-ab4b-57c279a62b05	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:29.944	2025-08-15 21:15:29.944
b9ebae50-27d9-43ac-8052-e286023e4e16	1896ee49-7e84-408a-a955-8ff335544891	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:30.129	2025-08-15 21:15:30.129
1118a5ef-2e37-434e-8859-7d3a9e57de5b	3d11dce9-9336-413d-931f-f82ee9fecc8a	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:30.311	2025-08-15 21:15:30.311
85790929-3502-4581-a5d2-0978265f7a02	416ed71f-e7f1-4f6b-9691-924f830d6904	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:30.496	2025-08-15 21:15:30.496
7aeee14d-01a3-46dc-9c01-46837256425e	f82a06f6-e805-461b-94a2-c2ce6a9e9c91	3f1b2054-26d7-4895-84bb-0322ec7042b0	READ_ONLY	f	\N	2025-08-15 21:15:30.677	2025-08-15 21:15:30.677
ea9e5709-8cec-4700-82cb-43a35dca3bd8	3a2d3ece-5d2b-47b7-bbf2-c685631d7f2a	b23e99db-5420-49c2-8781-bf5b4022405a	MANAGER_ACCESS	f	\N	2025-08-15 21:15:31.194	2025-08-15 21:15:31.194
e3e0a8f3-055d-4162-bcf9-d6a44fa43f5a	6e207a81-7228-4ebf-9745-5f22bf18fad3	b23e99db-5420-49c2-8781-bf5b4022405a	STAFF_ACCESS	f	\N	2025-08-15 21:15:31.199	2025-08-15 21:15:31.199
dfd2474d-da9f-4667-a642-6a4a441a5c53	e5821bc4-aa6c-4707-ac63-7256285248bb	b23e99db-5420-49c2-8781-bf5b4022405a	STAFF_ACCESS	f	\N	2025-08-15 21:15:31.201	2025-08-15 21:15:31.201
2a774d33-1e24-474f-8cfb-f5f208df183e	541a91d9-0241-41f9-9bed-a7cab725a7d7	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:31.382	2025-08-15 21:15:31.382
1b3424df-4b4e-4d3a-b364-34cbaaab6060	bb4e114c-2d7b-476a-bbf3-67c50896fb2e	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:31.564	2025-08-15 21:15:31.564
ed3527e7-2839-4c42-94c8-cbce919e01c7	5100d597-560d-489d-af2d-235076f30841	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:31.746	2025-08-15 21:15:31.746
78a2592c-2246-4a69-9e63-686632415f63	e915fb04-b580-40ae-8a35-7eb07949c507	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:31.932	2025-08-15 21:15:31.932
1290a35e-232b-4ace-8f8a-77080d93d7b8	bbe614ae-2383-4f72-90af-e4f59722eb36	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:32.118	2025-08-15 21:15:32.118
45f41ab5-56bf-4cb6-9e7f-285f6a972ebf	4fe8a88d-32f5-47d9-bef2-73f69b5d7491	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:32.3	2025-08-15 21:15:32.3
74a30a37-8d04-4cc2-a975-5df37f6cbf4f	eeae7ae6-a1ff-4ace-aa80-6ff1065add60	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:32.484	2025-08-15 21:15:32.484
87788f7f-d426-4857-a918-51f866e89aa0	c5b213ab-6caf-4b7c-ab4c-909ea92117fe	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:32.667	2025-08-15 21:15:32.667
1066b7bf-a068-4e30-a0d4-e65350462c80	34773a75-10d7-4371-a9af-40cfaccb78dc	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:32.857	2025-08-15 21:15:32.857
1183cf25-0e82-48ea-81d7-aa2de2e34bc6	a541f0b2-43c6-471a-823c-7ed166b3095c	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:33.064	2025-08-15 21:15:33.064
94f6b183-12e4-47f9-ade3-fd105979db37	67214f3c-db70-4264-8958-d659939a2d4c	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:33.262	2025-08-15 21:15:33.262
baad82ae-2f9e-4929-9608-b6c05b0eae80	0d76c3a8-b881-4273-829e-eca4280cf0cb	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:33.452	2025-08-15 21:15:33.452
5193b154-3135-4f46-b4f2-542c7ce76bf1	0dd97c34-d21b-4d40-9a2d-44bb5ca372b1	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:33.665	2025-08-15 21:15:33.665
dccf6369-875b-40e5-b694-66e3c0ebde1a	9bf15681-7144-4a2b-bdf7-cea7da068f47	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:33.864	2025-08-15 21:15:33.864
37ebcd9e-90bf-401b-9d3e-3da65cc8a413	88951605-b502-4327-b8b7-8f0574dc7141	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:34.068	2025-08-15 21:15:34.068
3a30a880-95f4-4f22-86ea-620cf4c165e3	d3e8af3e-565b-4730-b4f1-8aa39dd4c4ce	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:34.273	2025-08-15 21:15:34.273
8a682a52-b4ba-4dbe-9d6a-46db29f05873	87f2519b-93a2-4723-9bed-5ece8cba43c9	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:34.483	2025-08-15 21:15:34.483
a03e14e6-5ba8-4d1e-b020-27419c44747a	7ff92cd0-7706-4c5c-a825-469accf3867a	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:34.688	2025-08-15 21:15:34.688
5de15ab7-6a4b-40fd-847f-fc19cd97be00	cbf3fb80-71db-4137-96ae-690e6850d123	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:34.9	2025-08-15 21:15:34.9
428192cb-96f7-4577-bbae-6518210612bb	d231ee48-9bdf-4715-ae5b-438a67e59930	b23e99db-5420-49c2-8781-bf5b4022405a	READ_ONLY	f	\N	2025-08-15 21:15:35.09	2025-08-15 21:15:35.09
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1910503e-f3cd-4ce8-bc61-c77b3c17144f	a7571c9f99f287d8105c91bd70fda89b8f0a7f1476a09b0a6e82cedd7ea0c57e	2025-08-15 21:15:06.599887+00	20250815202113_fresh_schema_with_gym_member_subscriptions	\N	\N	2025-08-15 21:15:06.045093+00	1
\.


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: BusinessUnit BusinessUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessUnit"
    ADD CONSTRAINT "BusinessUnit_pkey" PRIMARY KEY (id);


--
-- Name: CustomerTransaction CustomerTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerTransaction"
    ADD CONSTRAINT "CustomerTransaction_pkey" PRIMARY KEY (id);


--
-- Name: GymMemberSubscription GymMemberSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GymMemberSubscription"
    ADD CONSTRAINT "GymMemberSubscription_pkey" PRIMARY KEY (id);


--
-- Name: MemberAuditLog MemberAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MemberAuditLog"
    ADD CONSTRAINT "MemberAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: MembershipPlan MembershipPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: PlatformRevenue PlatformRevenue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformRevenue"
    ADD CONSTRAINT "PlatformRevenue_pkey" PRIMARY KEY (id);


--
-- Name: SaasSubscription SaasSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaasSubscription"
    ADD CONSTRAINT "SaasSubscription_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: UserBranch UserBranch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserBranch"
    ADD CONSTRAINT "UserBranch_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Branch_tenantId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Branch_tenantId_name_key" ON public."Branch" USING btree ("tenantId", name);


--
-- Name: BusinessUnit_isPaid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BusinessUnit_isPaid_idx" ON public."BusinessUnit" USING btree ("isPaid");


--
-- Name: BusinessUnit_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BusinessUnit_tenantId_idx" ON public."BusinessUnit" USING btree ("tenantId");


--
-- Name: BusinessUnit_tenantId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BusinessUnit_tenantId_name_key" ON public."BusinessUnit" USING btree ("tenantId", name);


--
-- Name: BusinessUnit_trialEndsAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BusinessUnit_trialEndsAt_idx" ON public."BusinessUnit" USING btree ("trialEndsAt");


--
-- Name: BusinessUnit_unitType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BusinessUnit_unitType_idx" ON public."BusinessUnit" USING btree ("unitType");


--
-- Name: CustomerTransaction_amount_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerTransaction_amount_idx" ON public."CustomerTransaction" USING btree (amount);


--
-- Name: CustomerTransaction_businessType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerTransaction_businessType_idx" ON public."CustomerTransaction" USING btree ("businessType");


--
-- Name: CustomerTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerTransaction_createdAt_idx" ON public."CustomerTransaction" USING btree ("createdAt");


--
-- Name: CustomerTransaction_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerTransaction_customerId_idx" ON public."CustomerTransaction" USING btree ("customerId");


--
-- Name: CustomerTransaction_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerTransaction_status_idx" ON public."CustomerTransaction" USING btree (status);


--
-- Name: CustomerTransaction_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerTransaction_tenantId_idx" ON public."CustomerTransaction" USING btree ("tenantId");


--
-- Name: GymMemberSubscription_branchId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GymMemberSubscription_branchId_idx" ON public."GymMemberSubscription" USING btree ("branchId");


--
-- Name: GymMemberSubscription_endDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GymMemberSubscription_endDate_idx" ON public."GymMemberSubscription" USING btree ("endDate");


--
-- Name: GymMemberSubscription_memberId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GymMemberSubscription_memberId_idx" ON public."GymMemberSubscription" USING btree ("memberId");


--
-- Name: GymMemberSubscription_membershipPlanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GymMemberSubscription_membershipPlanId_idx" ON public."GymMemberSubscription" USING btree ("membershipPlanId");


--
-- Name: GymMemberSubscription_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GymMemberSubscription_status_idx" ON public."GymMemberSubscription" USING btree (status);


--
-- Name: GymMemberSubscription_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GymMemberSubscription_tenantId_idx" ON public."GymMemberSubscription" USING btree ("tenantId");


--
-- Name: MemberAuditLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MemberAuditLog_action_idx" ON public."MemberAuditLog" USING btree (action);


--
-- Name: MemberAuditLog_memberId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MemberAuditLog_memberId_idx" ON public."MemberAuditLog" USING btree ("memberId");


--
-- Name: MemberAuditLog_performedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MemberAuditLog_performedAt_idx" ON public."MemberAuditLog" USING btree ("performedAt");


--
-- Name: MembershipPlan_tenantId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembershipPlan_tenantId_name_key" ON public."MembershipPlan" USING btree ("tenantId", name);


--
-- Name: Payment_transactionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_transactionId_key" ON public."Payment" USING btree ("transactionId");


--
-- Name: Plan_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Plan_name_key" ON public."Plan" USING btree (name);


--
-- Name: PlatformRevenue_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformRevenue_createdAt_idx" ON public."PlatformRevenue" USING btree ("createdAt");


--
-- Name: PlatformRevenue_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformRevenue_paymentStatus_idx" ON public."PlatformRevenue" USING btree ("paymentStatus");


--
-- Name: PlatformRevenue_revenueType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformRevenue_revenueType_idx" ON public."PlatformRevenue" USING btree ("revenueType");


--
-- Name: PlatformRevenue_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformRevenue_tenantId_idx" ON public."PlatformRevenue" USING btree ("tenantId");


--
-- Name: SaasSubscription_businessUnitId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaasSubscription_businessUnitId_idx" ON public."SaasSubscription" USING btree ("businessUnitId");


--
-- Name: SaasSubscription_endDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaasSubscription_endDate_idx" ON public."SaasSubscription" USING btree ("endDate");


--
-- Name: SaasSubscription_nextBillingDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaasSubscription_nextBillingDate_idx" ON public."SaasSubscription" USING btree ("nextBillingDate");


--
-- Name: SaasSubscription_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaasSubscription_status_idx" ON public."SaasSubscription" USING btree (status);


--
-- Name: SaasSubscription_trialEndsAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaasSubscription_trialEndsAt_idx" ON public."SaasSubscription" USING btree ("trialEndsAt");


--
-- Name: Tenant_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);


--
-- Name: UserBranch_userId_branchId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserBranch_userId_branchId_key" ON public."UserBranch" USING btree ("userId", "branchId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Branch Branch_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusinessUnit BusinessUnit_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessUnit"
    ADD CONSTRAINT "BusinessUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerTransaction CustomerTransaction_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerTransaction"
    ADD CONSTRAINT "CustomerTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerTransaction CustomerTransaction_processedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerTransaction"
    ADD CONSTRAINT "CustomerTransaction_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CustomerTransaction CustomerTransaction_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerTransaction"
    ADD CONSTRAINT "CustomerTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GymMemberSubscription GymMemberSubscription_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GymMemberSubscription"
    ADD CONSTRAINT "GymMemberSubscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GymMemberSubscription GymMemberSubscription_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GymMemberSubscription"
    ADD CONSTRAINT "GymMemberSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GymMemberSubscription GymMemberSubscription_membershipPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GymMemberSubscription"
    ADD CONSTRAINT "GymMemberSubscription_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES public."MembershipPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GymMemberSubscription GymMemberSubscription_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GymMemberSubscription"
    ADD CONSTRAINT "GymMemberSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberAuditLog MemberAuditLog_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MemberAuditLog"
    ADD CONSTRAINT "MemberAuditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberAuditLog MemberAuditLog_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MemberAuditLog"
    ADD CONSTRAINT "MemberAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MembershipPlan MembershipPlan_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."Subscription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformRevenue PlatformRevenue_sourceTransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformRevenue"
    ADD CONSTRAINT "PlatformRevenue_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES public."CustomerTransaction"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlatformRevenue PlatformRevenue_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformRevenue"
    ADD CONSTRAINT "PlatformRevenue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SaasSubscription SaasSubscription_businessUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaasSubscription"
    ADD CONSTRAINT "SaasSubscription_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES public."BusinessUnit"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserBranch UserBranch_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserBranch"
    ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserBranch UserBranch_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserBranch"
    ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_deletedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 1yGAJXSLq7zyjWWCmvbsrPCgg8T6g20eU37Tn8Ff1KYzsavM0WNtDg4YxLlYk4N

