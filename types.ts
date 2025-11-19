
export enum AppSection {
  HOME = 'HOME',
  PORTALS = 'PORTALS', // Time Capsules
  MENTORS = 'MENTORS', // Persona Library
  CHRONICLE = 'CHRONICLE', // Learning/Comics
  EDITOR = 'EDITOR', // Discovery Desk
}

export interface NewsArticle {
  headline: string;
  date: string;
  content: string;
  imageUrl?: string;
  weather: string;
}

export interface TimePortal {
  id: string;
  year: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Scholar' | 'Time Lord';
}

export interface MissionBriefing {
  codename: string;
  objective: string;
  disguise: string;
  passphrase: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  era: string;
  avatar: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface RippleResult {
  consequence: string;
  stabilityChange: number; // -10 to -50
  futureHeadline: string;
}

export interface ChaosPuzzle {
  id: string;
  headline: string;
  scenario: string;
  misplacedFigure: string;
  currentEra: string;
  correctEra: string;
  challengeQuestion: string;
  options: string[];
  correctAnswerIndex: number;
  restorationMessage: string;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Relic';
  iconName: string;
}

export interface TravelerStats {
  rank: string;
  centuriesTraversed: number;
  paradoxesCaused: number;
  artifactsFound: number;
  majorDiscoveries: number;
  joinDate: string;
}

export interface TravelerProfile {
  email: string;
  stats: TravelerStats;
  inventory: Artifact[];
}