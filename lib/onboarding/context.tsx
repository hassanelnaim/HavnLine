"use client";

import * as React from "react";
import type { AiResponsibilities, Personality, VoiceId, Weekday } from "@/lib/database/types";
import { DEFAULT_RESPONSIBILITIES } from "@/lib/ai/generateInstructions";

export interface OnboardingServiceDraft {
  id: string;
  name: string;
  description: string;
  price: string; // dollars, string for controlled input
  durationMinutes: number;
}

export interface OnboardingHoursDraft {
  weekday: Weekday;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OnboardingDraft {
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

  calendarProvider: "google_calendar" | "microsoft_outlook" | null;
}

const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const defaultDraft: OnboardingDraft = {
  businessName: "",
  businessType: "",
  address: "",
  phone: "",
  website: "",
  description: "",
  hours: WEEKDAYS.map((weekday) => ({
    weekday,
    isOpen: weekday !== "sunday" && weekday !== "saturday",
    openTime: "09:00",
    closeTime: "17:00",
  })),
  services: [],
  receptionistName: "Alex",
  personality: "professional",
  responsibilities: DEFAULT_RESPONSIBILITIES,
  voiceId: "alex_professional",
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

  return (
    <OnboardingContext.Provider value={{ draft, update }}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
