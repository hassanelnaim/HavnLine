import type {
  DbBusiness, DbBusinessHours, DbService, DbAiReceptionist, DbAiVoiceConfig,
  DbCustomer, DbCall, DbCallMessage, DbAppointment, DbKnowledgeItem, DbIntegration,
  DbPromotion, Weekday,
} from "@/lib/database/types";

const BUSINESS_ID = "biz_demo_riverside";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const mockBusiness: DbBusiness = {
  id: BUSINESS_ID,
  name: "Riverside Auto & Tire",
  business_type: "Auto Repair",
  description: "A family-owned auto shop specializing in routine maintenance and brake work.",
  address: "412 Riverside Pkwy, Millbrook, NY",
  phone: "(845) 555-0142",
  website: "riversideautotire.example",
  timezone: "America/New_York",
  onboarding_step: "complete",
  onboarding_completed_at: daysAgo(21),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: "active",
  current_period_end: null,
  created_at: daysAgo(21),
  updated_at: daysAgo(1),
};

const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const mockBusinessHours: DbBusinessHours[] = WEEKDAYS.map((weekday, i) => ({
  id: `hrs_${weekday}`,
  business_id: BUSINESS_ID,
  weekday,
  is_open: i < 6,
  open_time: i < 6 ? "08:00" : null,
  close_time: i < 6 ? "17:00" : null,
}));

export const mockServices: DbService[] = [
  { id: "svc_1", business_id: BUSINESS_ID, name: "Oil Change", description: "Full synthetic oil change", price_cents: 5999, duration_minutes: 45, is_active: true, created_at: daysAgo(20), updated_at: daysAgo(20) },
  { id: "svc_2", business_id: BUSINESS_ID, name: "Brake Inspection", description: "Complete brake system check", price_cents: 3999, duration_minutes: 30, is_active: true, created_at: daysAgo(20), updated_at: daysAgo(20) },
  { id: "svc_3", business_id: BUSINESS_ID, name: "Brake Pad Replacement", description: "Front or rear brake pads", price_cents: 24999, duration_minutes: 120, is_active: true, created_at: daysAgo(20), updated_at: daysAgo(20) },
];

export const mockAiReceptionist: DbAiReceptionist = {
  id: "ai_1",
  business_id: BUSINESS_ID,
  name: "Alex",
  personality: "professional",
  responsibilities: {
    answer_questions: true,
    schedule_appointments: true,
    reschedule_appointments: true,
    cancel_appointments: false,
    collect_customer_info: true,
    escalate_to_human: true,
  },
  status: "online",
  escalation_rules: null,
  booking_rules: null,
  generated_instructions: null,
  created_at: daysAgo(20),
  updated_at: daysAgo(5),
};

export const mockVoiceConfig: DbAiVoiceConfig = {
  id: "voice_1",
  business_id: BUSINESS_ID,
  voice_id: "alex_professional",
  provider: null,
  provider_voice_ref: null,
  provider_voice_name: null,
  created_at: daysAgo(20),
};

export const mockCustomers: DbCustomer[] = [
  { id: "cust_1", business_id: BUSINESS_ID, name: "John Smith", phone: "3135550101", email: null, notes: null, created_at: daysAgo(10), updated_at: daysAgo(10) },
  { id: "cust_2", business_id: BUSINESS_ID, name: "Maria Garcia", phone: "3135550102", email: null, notes: null, created_at: daysAgo(8), updated_at: daysAgo(8) },
  { id: "cust_3", business_id: BUSINESS_ID, name: "David Lee", phone: "3135550103", email: null, notes: null, created_at: daysAgo(5), updated_at: daysAgo(5) },
  { id: "cust_4", business_id: BUSINESS_ID, name: "Emily Chen", phone: "3135550104", email: null, notes: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
  { id: "cust_5", business_id: BUSINESS_ID, name: "Robert Johnson", phone: "3135550105", email: null, notes: null, created_at: daysAgo(1), updated_at: daysAgo(1) },
];

export const mockCalls: DbCall[] = [
  { id: "call_1", business_id: BUSINESS_ID, customer_id: "cust_1", customer_name: "John Smith", phone: "3135550101", started_at: daysAgo(1), duration_seconds: 184, outcome: "appointment_booked", status: "completed", handled_by: "ai", escalation_reason: null, recording_url: null, created_at: daysAgo(1) },
  { id: "call_2", business_id: BUSINESS_ID, customer_id: "cust_2", customer_name: "Maria Garcia", phone: "3135550102", started_at: daysAgo(2), duration_seconds: 95, outcome: "question_answered", status: "completed", handled_by: "ai", escalation_reason: null, recording_url: null, created_at: daysAgo(2) },
  { id: "call_3", business_id: BUSINESS_ID, customer_id: "cust_3", customer_name: "David Lee", phone: "3135550103", started_at: daysAgo(3), duration_seconds: 210, outcome: "escalated", status: "completed", handled_by: "ai", escalation_reason: "Customer requested a refund for prior service.", recording_url: null, created_at: daysAgo(3) },
];

export const mockCallMessages: DbCallMessage[] = [
  { id: "msg_1", call_id: "call_1", role: "customer", content: "Hi, I need an oil change.", tool_call: null, created_at: daysAgo(1) },
  { id: "msg_2", call_id: "call_1", role: "ai", content: "I can help with that. What day works for you?", tool_call: null, created_at: daysAgo(1) },
];

export const mockAppointments: DbAppointment[] = [
  { id: "appt_1", business_id: BUSINESS_ID, customer_id: "cust_1", customer_name: "John Smith", phone: "3135550101", service_id: "svc_1", service_name: "Oil Change", date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: "9:00 AM", status: "confirmed", created_via: "ai", created_at: daysAgo(1) },
];

export const mockKnowledgeItems: DbKnowledgeItem[] = [
  { id: "kb_1", business_id: BUSINESS_ID, category: "faq", question: "Do you offer same-day appointments?", title: null, content: "Yes, when availability allows.", created_at: daysAgo(15), updated_at: daysAgo(15) },
];

export const mockPromotions: DbPromotion[] = [];

export const mockIntegrations: DbIntegration[] = [
  { id: "int_google", business_id: BUSINESS_ID, provider: "google_calendar", status: "not_connected", external_account_id: null, connected_at: null, metadata: null },
  { id: "int_icloud", business_id: BUSINESS_ID, provider: "icloud_calendar", status: "not_connected", external_account_id: null, connected_at: null, metadata: null },
  { id: "int_outlook", business_id: BUSINESS_ID, provider: "microsoft_outlook", status: "coming_soon", external_account_id: null, connected_at: null, metadata: null },
  { id: "int_twilio", business_id: BUSINESS_ID, provider: "twilio", status: "not_connected", external_account_id: null, connected_at: null, metadata: null },
  { id: "int_sms", business_id: BUSINESS_ID, provider: "sms", status: "not_connected", external_account_id: null, connected_at: null, metadata: null },
  { id: "int_voice", business_id: BUSINESS_ID, provider: "voice_provider", status: "connected", external_account_id: null, connected_at: null, metadata: null },
];
