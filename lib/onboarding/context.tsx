"use client";

import * as React from "react";
import type { AiResponsibilities, Personality, VoiceId, Weekday } from "@/lib/database/types";

export interface OnboardingHoursDraft {
  weekday: Weekday;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OnboardingServiceDraft {
  id: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
}

export interface OnboardingDraft {
  businessId: string | null;
  businessName: string;
  businessType: string;
  address: string;
  phone: string;
  website: string;
  description: string;

  hours: OnboardingHoursDraft[];

  services: OnboardingServiceDraft[];

  receptionistName: string;
  personality: Personality;
  responsibilities: AiResponsibilities;

  voiceId: VoiceId;
  customVoiceRef: string | null;
  customVoiceName: string | null;

  calendarProvider: "google_calendar" | "microsoft_outlook" | null;
}

const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const DEFAULT_RESPONSIBILITIES: AiResponsibilities = {
  answer_questions: true,
  schedule_appointments: true,
  reschedule_appointments: true,
  cancel_appointments: true,
  collect_customer_info: true,
  escalate_to_human: true,
};

const defaultDraft: OnboardingDraft = {
  businessId: null,
  businessName: "",
  businessType: "",
  address: "",
  phone: "",
  website: "",
  description: "",
  hours: WEEKDAYS.map((weekday, i) => ({
    weekday,
    isOpen: i < 6,
    openTime: "09:00",
    closeTime: "17:00",
  })),
  services: [],
  receptionistName: "Alex",
  personality: "professional",
  responsibilities: DEFAULT_RESPONSIBILITIES,
  voiceId: "alex_professional",
  customVoiceRef: null,
  customVoiceName: null,
  calendarProvider: null,
};

interface OnboardingContextValue {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<OnboardingDraft>(defaultDraft);

  const update = React.useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  return <OnboardingContext.Provider value={{ draft, update }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
