/**
 * database/types.ts
 *
 * Hand-written types mirroring the Supabase schema defined in schema.sql.
 * Once the Supabase project is connected, these can be replaced by
 * generated types (`supabase gen types typescript`) — the shape is kept
 * intentionally close to the SQL so that swap is mechanical.
 */

export type UUID = string;
export type ISODateTime = string; // timestamptz
export type ISODate = string; // date

export type MemberRole = "owner" | "admin" | "member";

export interface DbUser {
  id: UUID;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: ISODateTime;
}

export interface DbBusiness {
  id: UUID;
  name: string;
  business_type: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: ISODateTime | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: "none" | "trialing" | "active" | "past_due" | "canceled";
  current_period_end: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type OnboardingStep =
  | "business_info"
  | "hours"
  | "services"
  | "ai_receptionist"
  | "voice"
  | "calendar"
  | "complete";

export interface DbBusinessMember {
  id: UUID;
  business_id: UUID;
  user_id: UUID;
  role: MemberRole;
  created_at: ISODateTime;
}

export interface DbService {
  id: UUID;
  business_id: UUID;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DbBusinessHours {
  id: UUID;
  business_id: UUID;
  weekday: Weekday;
  is_open: boolean;
  open_time: string | null; // "HH:MM"
  close_time: string | null; // "HH:MM"
}

export type Personality = "professional" | "friendly" | "warm" | "energetic" | "calm";

export interface AiResponsibilities {
  answer_questions: boolean;
  schedule_appointments: boolean;
  reschedule_appointments: boolean;
  cancel_appointments: boolean;
  collect_customer_info: boolean;
  escalate_to_human: boolean;
}

export interface DbAiReceptionist {
  id: UUID;
  business_id: UUID;
  name: string;
  personality: Personality;
  responsibilities: AiResponsibilities;
  status: "online" | "offline";
  escalation_rules: string | null;
  booking_rules: string | null;
  generated_instructions: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Internal voice identifiers — NOT tied to any specific provider. */
export type VoiceId = "alex_professional" | "sarah_warm" | "james_calm" | "emma_friendly";

export interface DbAiVoiceConfig {
  id: UUID;
  business_id: UUID;
  voice_id: VoiceId;
  provider: string | null; // e.g. "elevenlabs" — null until connected
  provider_voice_ref: string | null; // provider-specific voice reference, set later
  created_at: ISODateTime;
}

export interface DbCustomer {
  id: UUID;
  business_id: UUID;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type CallOutcome =
  | "appointment_booked"
  | "question_answered"
  | "escalated"
  | "no_action"
  | "missed";

export type CallStatus = "completed" | "in_progress" | "missed" | "voicemail";

export interface DbCall {
  id: UUID;
  business_id: UUID;
  customer_id: UUID | null;
  customer_name: string;
  phone: string;
  started_at: ISODateTime;
  duration_seconds: number;
  outcome: CallOutcome;
  status: CallStatus;
  handled_by: "ai" | "human";
  escalation_reason: string | null;
  recording_url: string | null;
  created_at: ISODateTime;
}

export interface DbCallMessage {
  id: UUID;
  call_id: UUID;
  role: "customer" | "ai" | "system";
  content: string;
  tool_call: string | null; // JSON-encoded tool call, if any
  created_at: ISODateTime;
}

export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no_show";

export interface DbAppointment {
  id: UUID;
  business_id: UUID;
  customer_id: UUID | null;
  customer_name: string;
  phone: string;
  service_id: UUID | null;
  service_name: string;
  date: ISODate;
  time: string; // "HH:MM"
  status: AppointmentStatus;
  created_via: "ai" | "human";
  created_at: ISODateTime;
}

export type KnowledgeCategory =
  | "business_info"
  | "services"
  | "pricing"
  | "faq"
  | "policy"
  | "custom";

export interface DbKnowledgeItem {
  id: UUID;
  business_id: UUID;
  category: KnowledgeCategory;
  question: string | null; // used for FAQ entries
  title: string | null; // used for free-form entries
  content: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type IntegrationProvider =
  | "google_calendar"
  | "microsoft_outlook"
  | "twilio"
  | "sms"
  | "voice_provider";

export type IntegrationStatus = "connected" | "not_connected" | "coming_soon";

export interface DbIntegration {
  id: UUID;
  business_id: UUID;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  external_account_id: string | null;
  connected_at: ISODateTime | null;
  metadata: Record<string, unknown> | null;
}

/** Convenience: the full "Database" generic shape Supabase's client expects. */
export interface Database {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Partial<DbUser>; Update: Partial<DbUser> };
      businesses: { Row: DbBusiness; Insert: Partial<DbBusiness>; Update: Partial<DbBusiness> };
      business_members: {
        Row: DbBusinessMember;
        Insert: Partial<DbBusinessMember>;
        Update: Partial<DbBusinessMember>;
      };
      services: { Row: DbService; Insert: Partial<DbService>; Update: Partial<DbService> };
      business_hours: {
        Row: DbBusinessHours;
        Insert: Partial<DbBusinessHours>;
        Update: Partial<DbBusinessHours>;
      };
      ai_receptionists: {
        Row: DbAiReceptionist;
        Insert: Partial<DbAiReceptionist>;
        Update: Partial<DbAiReceptionist>;
      };
      ai_voice_configs: {
        Row: DbAiVoiceConfig;
        Insert: Partial<DbAiVoiceConfig>;
        Update: Partial<DbAiVoiceConfig>;
      };
      customers: { Row: DbCustomer; Insert: Partial<DbCustomer>; Update: Partial<DbCustomer> };
      calls: { Row: DbCall; Insert: Partial<DbCall>; Update: Partial<DbCall> };
      call_messages: {
        Row: DbCallMessage;
        Insert: Partial<DbCallMessage>;
        Update: Partial<DbCallMessage>;
      };
      appointments: {
        Row: DbAppointment;
        Insert: Partial<DbAppointment>;
        Update: Partial<DbAppointment>;
      };
      knowledge_items: {
        Row: DbKnowledgeItem;
        Insert: Partial<DbKnowledgeItem>;
        Update: Partial<DbKnowledgeItem>;
      };
      integrations: {
        Row: DbIntegration;
        Insert: Partial<DbIntegration>;
        Update: Partial<DbIntegration>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
