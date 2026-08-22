/**
 * mock/data.ts
 *
 * ⚠️ MOCK DATA LAYER — remove when real Supabase queries are wired up.
 *
 * Everything in this file simulates what `lib/data/*.ts` will eventually
 * fetch from Supabase for the demo business "Riverside Auto & Tire".
 * Dates are computed relative to "now" so the dashboard always looks
 * current. Nothing here touches a network or a database.
 */

import type {
  AiResponsibilities,
  DbAiReceptionist,
  DbAiVoiceConfig,
  DbAppointment,
  DbBusiness,
  DbBusinessHours,
  DbCall,
  DbCallMessage,
  DbCustomer,
  DbIntegration,
  DbKnowledgeItem,
  DbService,
  Weekday,
} from "@/lib/database/types";

const BUSINESS_ID = "biz_demo_riverside";

function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const mockBusiness: DbBusiness = {
  id: BUSINESS_ID,
  name: "Riverside Auto & Tire",
  business_type: "Auto Repair Shop",
  description:
    "A family-owned auto shop specializing in routine maintenance, tires, and brake work. Known for honest, no-upsell service.",
  address: "412 Riverside Pkwy, Millbrook, NY",
  phone: "(845) 555-0142",
  website: "https://riversideautotire.example",
  timezone: "America/New_York",
  onboarding_step: "complete",
  onboarding_completed_at: daysAgo(21),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: "active",
  current_period_end: null,
  created_at: daysAgo(30),
  updated_at: daysAgo(1),
};

export const mockServices: DbService[] = [
  {
    id: "svc_oil_change",
    business_id: BUSINESS_ID,
    name: "Oil Change",
    description: "Full synthetic oil change with a multi-point inspection.",
    price_cents: 5999,
    duration_minutes: 45,
    is_active: true,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: "svc_tire_rotation",
    business_id: BUSINESS_ID,
    name: "Tire Rotation",
    description: "Rotate and balance all four tires.",
    price_cents: 3900,
    duration_minutes: 30,
    is_active: true,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: "svc_brake_inspection",
    business_id: BUSINESS_ID,
    name: "Brake Inspection",
    description: "Full brake system inspection with a written report.",
    price_cents: 3999,
    duration_minutes: 30,
    is_active: true,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: "svc_brake_pad_replacement",
    business_id: BUSINESS_ID,
    name: "Brake Pad Replacement",
    description: "Front or rear brake pad replacement, parts and labor included.",
    price_cents: 24999,
    duration_minutes: 120,
    is_active: true,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
];

const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const mockBusinessHours: DbBusinessHours[] = WEEKDAYS.map((weekday) => ({
  id: `hrs_${weekday}`,
  business_id: BUSINESS_ID,
  weekday,
  is_open: weekday !== "sunday",
  open_time: weekday === "saturday" ? "09:00" : weekday === "sunday" ? null : "08:00",
  close_time: weekday === "saturday" ? "14:00" : weekday === "sunday" ? null : "18:00",
}));

export const mockAiResponsibilities: AiResponsibilities = {
  answer_questions: true,
  schedule_appointments: true,
  reschedule_appointments: true,
  cancel_appointments: false,
  collect_customer_info: true,
  escalate_to_human: true,
};

export const mockAiReceptionist: DbAiReceptionist = {
  id: "ai_demo_riverside",
  business_id: BUSINESS_ID,
  name: "Alex",
  personality: "professional",
  responsibilities: mockAiResponsibilities,
  status: "online",
  escalation_rules:
    "Escalate refund requests, discount requests, complaints, and anything outside the services listed above.",
  booking_rules: "Always confirm date, time, and service back to the customer before booking.",
  generated_instructions: null,
  created_at: daysAgo(21),
  updated_at: daysAgo(2),
};

export const mockVoiceConfig: DbAiVoiceConfig = {
  id: "voice_demo_riverside",
  business_id: BUSINESS_ID,
  voice_id: "alex_professional",
  provider: null,
  provider_voice_ref: null,
  provider_voice_name: null,
  created_at: daysAgo(21),
};

export const mockCustomers: DbCustomer[] = [
  {
    id: "cust_1",
    business_id: BUSINESS_ID,
    name: "Sarah Lee",
    phone: "(845) 555-0110",
    email: "sarah.lee@example.com",
    notes: "Drives a 2019 Subaru Outback. Prefers morning appointments.",
    created_at: daysAgo(18),
    updated_at: daysAgo(2),
  },
  {
    id: "cust_2",
    business_id: BUSINESS_ID,
    name: "Marcus Webb",
    phone: "(845) 555-0187",
    email: "marcus.webb@example.com",
    notes: null,
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  },
  {
    id: "cust_3",
    business_id: BUSINESS_ID,
    name: "Jordan Reyes",
    phone: "(845) 555-0199",
    email: null,
    notes: "Asked about an extended warranty on brake work.",
    created_at: daysAgo(9),
    updated_at: daysAgo(1),
  },
  {
    id: "cust_4",
    business_id: BUSINESS_ID,
    name: "Priya Patel",
    phone: "(845) 555-0134",
    email: "priya.patel@example.com",
    notes: null,
    created_at: daysAgo(5),
    updated_at: daysAgo(5),
  },
  {
    id: "cust_5",
    business_id: BUSINESS_ID,
    name: "Tom Nguyen",
    phone: "(845) 555-0176",
    email: null,
    notes: "Called about a refund — escalated to Mike.",
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
  },
];

export const mockCalls: DbCall[] = [
  {
    id: "call_1",
    business_id: BUSINESS_ID,
    customer_id: "cust_1",
    customer_name: "Sarah Lee",
    phone: "(845) 555-0110",
    started_at: daysAgo(0, 9, 12),
    duration_seconds: 94,
    outcome: "appointment_booked",
    status: "completed",
    handled_by: "ai",
    escalation_reason: null,
    recording_url: null,
    created_at: daysAgo(0, 9, 12),
  },
  {
    id: "call_2",
    business_id: BUSINESS_ID,
    customer_id: "cust_2",
    customer_name: "Marcus Webb",
    phone: "(845) 555-0187",
    started_at: daysAgo(0, 11, 40),
    duration_seconds: 51,
    outcome: "question_answered",
    status: "completed",
    handled_by: "ai",
    escalation_reason: null,
    recording_url: null,
    created_at: daysAgo(0, 11, 40),
  },
  {
    id: "call_3",
    business_id: BUSINESS_ID,
    customer_id: "cust_5",
    customer_name: "Tom Nguyen",
    phone: "(845) 555-0176",
    started_at: daysAgo(1, 15, 5),
    duration_seconds: 132,
    outcome: "escalated",
    status: "completed",
    handled_by: "ai",
    escalation_reason: "Customer requested a refund for a prior brake job.",
    recording_url: null,
    created_at: daysAgo(1, 15, 5),
  },
  {
    id: "call_4",
    business_id: BUSINESS_ID,
    customer_id: "cust_3",
    customer_name: "Jordan Reyes",
    phone: "(845) 555-0199",
    started_at: daysAgo(1, 8, 20),
    duration_seconds: 87,
    outcome: "appointment_booked",
    status: "completed",
    handled_by: "ai",
    escalation_reason: null,
    recording_url: null,
    created_at: daysAgo(1, 8, 20),
  },
  {
    id: "call_5",
    business_id: BUSINESS_ID,
    customer_id: "cust_4",
    customer_name: "Priya Patel",
    phone: "(845) 555-0134",
    started_at: daysAgo(2, 13, 50),
    duration_seconds: 63,
    outcome: "question_answered",
    status: "completed",
    handled_by: "ai",
    escalation_reason: null,
    recording_url: null,
    created_at: daysAgo(2, 13, 50),
  },
  {
    id: "call_6",
    business_id: BUSINESS_ID,
    customer_id: null,
    customer_name: "Unknown Caller",
    phone: "(845) 555-0161",
    started_at: daysAgo(3, 17, 2),
    duration_seconds: 0,
    outcome: "missed",
    status: "missed",
    handled_by: "ai",
    escalation_reason: null,
    recording_url: null,
    created_at: daysAgo(3, 17, 2),
  },
];

export const mockCallMessages: Record<string, DbCallMessage[]> = {
  call_1: [
    { id: "m1", call_id: "call_1", role: "ai", content: "Thanks for calling Riverside Auto & Tire, this is Alex. How can I help?", tool_call: null, created_at: daysAgo(0, 9, 12) },
    { id: "m2", call_id: "call_1", role: "customer", content: "Hi, I'd like to book an oil change.", tool_call: null, created_at: daysAgo(0, 9, 12) },
    { id: "m3", call_id: "call_1", role: "ai", content: "Sure — what date works for you?", tool_call: null, created_at: daysAgo(0, 9, 13) },
    { id: "m4", call_id: "call_1", role: "customer", content: "Tomorrow morning if possible.", tool_call: null, created_at: daysAgo(0, 9, 13) },
    { id: "m5", call_id: "call_1", role: "ai", content: "I have 8:30 or 9:00 AM open tomorrow for an Oil Change. Which works?", tool_call: JSON.stringify({ name: "check_availability", input: { date: dateOffset(1), service: "Oil Change" } }), created_at: daysAgo(0, 9, 13) },
    { id: "m6", call_id: "call_1", role: "customer", content: "9:00 works great.", tool_call: null, created_at: daysAgo(0, 9, 14) },
    { id: "m7", call_id: "call_1", role: "ai", content: "You're all set for 9:00 AM tomorrow. See you then, Sarah!", tool_call: JSON.stringify({ name: "book_appointment", input: { date: dateOffset(1), time: "9:00 AM", service: "Oil Change" } }), created_at: daysAgo(0, 9, 14) },
  ],
  call_3: [
    { id: "m8", call_id: "call_3", role: "ai", content: "Thanks for calling Riverside Auto & Tire, this is Alex.", tool_call: null, created_at: daysAgo(1, 15, 5) },
    { id: "m9", call_id: "call_3", role: "customer", content: "I want a refund for the brake job I got last month, it's still squeaking.", tool_call: null, created_at: daysAgo(1, 15, 5) },
    { id: "m10", call_id: "call_3", role: "ai", content: "I want to make sure that's handled properly, so I'm passing this to our team — they'll follow up with you shortly.", tool_call: JSON.stringify({ name: "create_human_request", input: { reason: "Refund request", details: "Brake job from last month still squeaking." } }), created_at: daysAgo(1, 15, 6) },
  ],
};

export const mockAppointments: DbAppointment[] = [
  {
    id: "apt_1",
    business_id: BUSINESS_ID,
    customer_id: "cust_1",
    customer_name: "Sarah Lee",
    phone: "(845) 555-0110",
    service_id: "svc_oil_change",
    service_name: "Oil Change",
    date: dateOffset(1),
    time: "9:00 AM",
    status: "confirmed",
    created_via: "ai",
    created_at: daysAgo(0, 9, 14),
  },
  {
    id: "apt_2",
    business_id: BUSINESS_ID,
    customer_id: "cust_3",
    customer_name: "Jordan Reyes",
    phone: "(845) 555-0199",
    service_id: "svc_brake_inspection",
    service_name: "Brake Inspection",
    date: dateOffset(2),
    time: "11:00 AM",
    status: "confirmed",
    created_via: "ai",
    created_at: daysAgo(1, 8, 20),
  },
  {
    id: "apt_3",
    business_id: BUSINESS_ID,
    customer_id: "cust_4",
    customer_name: "Priya Patel",
    phone: "(845) 555-0134",
    service_id: "svc_tire_rotation",
    service_name: "Tire Rotation",
    date: dateOffset(3),
    time: "1:30 PM",
    status: "pending",
    created_via: "ai",
    created_at: daysAgo(2, 13, 50),
  },
  {
    id: "apt_4",
    business_id: BUSINESS_ID,
    customer_id: "cust_2",
    customer_name: "Marcus Webb",
    phone: "(845) 555-0187",
    service_id: "svc_brake_pad_replacement",
    service_name: "Brake Pad Replacement",
    date: dateOffset(-1),
    time: "10:00 AM",
    status: "completed",
    created_via: "ai",
    created_at: daysAgo(4),
  },
];

export const mockKnowledgeItems: DbKnowledgeItem[] = [
  {
    id: "kb_1",
    business_id: BUSINESS_ID,
    category: "faq",
    question: "Do you offer same-day appointments?",
    title: null,
    content: "Yes, when availability allows — ask the AI to check same-day slots.",
    created_at: daysAgo(20),
    updated_at: daysAgo(20),
  },
  {
    id: "kb_2",
    business_id: BUSINESS_ID,
    category: "policy",
    question: null,
    title: "Warranty",
    content: "All brake work includes a 12-month / 12,000-mile parts and labor warranty.",
    created_at: daysAgo(20),
    updated_at: daysAgo(20),
  },
  {
    id: "kb_3",
    business_id: BUSINESS_ID,
    category: "business_info",
    question: null,
    title: "Parking",
    content: "Free customer parking is available in the lot next to the building.",
    created_at: daysAgo(19),
    updated_at: daysAgo(19),
  },
  {
    id: "kb_4",
    business_id: BUSINESS_ID,
    category: "faq",
    question: "Do you accept walk-ins?",
    title: null,
    content: "We prioritize scheduled appointments, but walk-ins are welcome if a bay is open.",
    created_at: daysAgo(15),
    updated_at: daysAgo(15),
  },
];

export const mockIntegrations: DbIntegration[] = [
  {
    id: "int_google",
    business_id: BUSINESS_ID,
    provider: "google_calendar",
    status: "not_connected",
    external_account_id: null,
    connected_at: null,
    metadata: null,
  },
  {
    id: "int_outlook",
    business_id: BUSINESS_ID,
    provider: "microsoft_outlook",
    status: "not_connected",
    external_account_id: null,
    connected_at: null,
    metadata: null,
  },
  {
    id: "int_twilio",
    business_id: BUSINESS_ID,
    provider: "twilio",
    status: "coming_soon",
    external_account_id: null,
    connected_at: null,
    metadata: null,
  },
  {
    id: "int_sms",
    business_id: BUSINESS_ID,
    provider: "sms",
    status: "coming_soon",
    external_account_id: null,
    connected_at: null,
    metadata: null,
  },
  {
    id: "int_voice",
    business_id: BUSINESS_ID,
    provider: "voice_provider",
    status: "coming_soon",
    external_account_id: null,
    connected_at: null,
    metadata: null,
  },
];
