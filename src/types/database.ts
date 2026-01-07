export type OnboardingStepKey =
  | 'w9'
  | '1099'
  | 'headshot'
  | 'certifications'
  | 'profile'
  | 'zoom'
  | 'gmail'
  | 'salesforce'
  | 'deck_reviewed';

export interface Coach {
  id: string;
  name: string;
  email: string;
  onboarding_token: string;
  status: 'pending' | 'in_progress' | 'complete';
  created_at: string;
}

export interface OnboardingStep {
  id: string;
  coach_id: string;
  step_key: OnboardingStepKey;
  completed: boolean;
  completed_at: string | null;
  file_path: string | null;
}

export interface CoachProfile {
  id: string;
  coach_id: string;
  bio: string | null;
  headshot_path: string | null;
  specialties: string[] | null;
  credentials: string | null;
  linkedin_url: string | null;
  scheduling_preferences: string | null;
  updated_at: string;
}

export interface CoachWithProgress extends Coach {
  completed_steps: number;
  total_steps: number;
  onboarding_steps?: OnboardingStep[];
  profile?: CoachProfile;
}

export const ONBOARDING_STEPS: { key: OnboardingStepKey; label: string; description: string; type: 'upload' | 'form' | 'manual' | 'checkbox' }[] = [
  { key: 'w9', label: 'W9 Form', description: 'Upload your completed W9 form (PDF)', type: 'upload' },
  { key: '1099', label: '1099 Agreement', description: 'Upload your signed 1099 contractor agreement (PDF)', type: 'upload' },
  { key: 'headshot', label: 'Professional Headshot', description: 'Upload a professional photo for your profile', type: 'upload' },
  { key: 'certifications', label: 'Certifications', description: 'Upload any relevant certifications (optional, PDF)', type: 'upload' },
  { key: 'profile', label: 'Coach Profile', description: 'Complete your coach profile with bio, specialties, and credentials', type: 'form' },
  { key: 'deck_reviewed', label: 'Onboarding Deck Reviewed', description: 'Confirm you have reviewed the onboarding deck', type: 'checkbox' },
  { key: 'zoom', label: 'Zoom Setup', description: 'Zoom account configured by admin', type: 'manual' },
  { key: 'gmail', label: 'Gmail Setup', description: 'Gmail account configured by admin', type: 'manual' },
  { key: 'salesforce', label: 'Salesforce Portal', description: 'Salesforce portal access granted by admin', type: 'manual' },
];

export const COACHING_SPECIALTIES = [
  'Executive Coaching',
  'Career Coaching',
  'Leadership Development',
  'Life Coaching',
  'Health & Wellness',
  'Performance Coaching',
  'Team Coaching',
  'Mindfulness & Stress Management',
  'Communication Skills',
  'Work-Life Balance',
  'Confidence Building',
  'Goal Setting',
  'Transition Coaching',
  'Entrepreneurship',
];

export type Database = {
  public: {
    Tables: {
      coaches: {
        Row: Coach;
        Insert: Omit<Coach, 'id' | 'created_at' | 'onboarding_token'> & {
          id?: string;
          created_at?: string;
          onboarding_token?: string;
        };
        Update: Partial<Omit<Coach, 'id'>>;
      };
      onboarding_steps: {
        Row: OnboardingStep;
        Insert: Omit<OnboardingStep, 'id'> & { id?: string };
        Update: Partial<Omit<OnboardingStep, 'id'>>;
      };
      coach_profiles: {
        Row: CoachProfile;
        Insert: Omit<CoachProfile, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Omit<CoachProfile, 'id'>>;
      };
    };
  };
};
