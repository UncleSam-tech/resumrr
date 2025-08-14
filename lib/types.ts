export type SortKey =
  | 'createdAt'
  | 'name'
  | 'jobTitle'
  | 'yearsExperience'
  | 'credibilityScore'
  | 'atsScore';

export type SortDir = 'asc' | 'desc';

export type Candidate = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  driveUrl: string;
  summary: string;
  highlights: string[]; // legacy; prefer skills
  skills: string[];
  yearsExperience: number;
  credibilityScore: number;
  atsScore: number;
  createdAt: string; // ISO date string
};

