export type SortKey = 'createdAt' | 'name' | 'jobTitle';

export type SortDir = 'asc' | 'desc';

export type Candidate = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  driveUrl: string;
  summary: string;
  highlights: string[];
  createdAt: string; // ISO date string
};

