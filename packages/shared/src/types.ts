export type GrowthPillar = 'emotional' | 'mental' | 'academic' | 'personal';

export interface PillarInfo {
  id: GrowthPillar;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  accentColor: string;
}

export const PILLARS: Record<GrowthPillar, PillarInfo> = {
  emotional: {
    id: 'emotional',
    title: 'Emotional Resilience',
    tagline: 'Quiet inner stability',
    description: 'Overcoming anxiety, handling loneliness, processing self-doubt, and finding calm self-compassion.',
    iconName: 'HeartHandshake',
    accentColor: '#38BDF8'
  },
  mental: {
    id: 'mental',
    title: 'Mental Clarity',
    tagline: 'Sharp focus, quiet thoughts',
    description: 'Breaking through brain fog and overthinking, mastering mental models, and cultivating deep presence.',
    iconName: 'Brain',
    accentColor: '#A78BFA'
  },
  academic: {
    id: 'academic',
    title: 'Academic Mastery',
    tagline: 'Retain more, stress less',
    description: 'Active recall systems, conquering exam pressure, beating procrastination, and structured study habits.',
    iconName: 'GraduationCap',
    accentColor: '#34D399'
  },
  personal: {
    id: 'personal',
    title: 'Personal Momentum',
    tagline: 'Habits that stick',
    description: 'Daily discipline architecture, authentic self-confidence, clear career direction, and purpose.',
    iconName: 'Sparkles',
    accentColor: '#F5871F'
  }
};

export type ProgramType = 'challenge' | 'course';
export type ProgramStatus = 'draft' | 'published' | 'live' | 'completed' | 'archived';

export interface Program {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  type: ProgramType;
  category: GrowthPillar;
  tags: string[];
  thumbnailUrl: string;
  posterImageUrl: string;
  coverImageUrl?: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  status: ProgramStatus;
  startsAt?: string;
  endsAt?: string;
  enrollmentDeadline?: string;
  maxSeats?: number;
  enrolledCount?: number;
  isFeatured?: boolean;
  isTrendingPinned?: boolean;
  sortOrder?: number;
  lessonsCount?: number;
  durationHours?: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'student' | 'staff' | 'admin';
  goalTag?: GrowthPillar;
}

export interface Helpline {
  name: string;
  number: string;
  hours: string;
  description: string;
  verified: boolean;
}

export const CRISIS_HELPLINES: Helpline[] = [
  {
    name: 'Tele-MANAS (Govt. of India)',
    number: '14416 / 1800-891-4416',
    hours: '24x7 Toll-Free',
    description: 'National tele-mental health programme providing free, confidential psychological counselling.',
    verified: false // verify before launch as required
  },
  {
    name: 'KIRAN Helpline',
    number: '1800-599-0019',
    hours: '24x7',
    description: 'Ministry of Social Justice 24/7 mental health rehabilitation helpline.',
    verified: false
  },
  {
    name: 'Vandrevala Foundation',
    number: '+91 9999 666 555',
    hours: '24x7 Free',
    description: 'Mental health support and suicide prevention counseling in multiple Indian languages.',
    verified: false
  }
];

