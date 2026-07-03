export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  isVerified: boolean;
}

export interface Bug {
  title: string;
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SecurityIssue {
  title: string;
  cve?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface PerformanceIssue {
  title: string;
  impact: string;
  description: string;
  recommendation: string;
}

export interface SimpleIssue {
  title: string;
  description: string;
  recommendation: string;
}

export interface Complexity {
  time: string;
  space: string;
}

export interface Review {
  _id: string;
  userId: string;
  language: string;
  sourceCode: string;
  optimizedCode: string;
  aiSummary: string;
  score: number;
  reviewTime: number;
  bugs: Bug[];
  securityIssues: SecurityIssue[];
  performanceIssues: PerformanceIssue[];
  codeSmells: SimpleIssue[];
  bestPractices: SimpleIssue[];
  complexity: Complexity;
  documentation: string;
  unitTests: string;
  createdAt: string;
}

export interface ReviewHistoryItem {
  id: string;
  title: string;
  language: string;
  isFavorite: boolean;
  lastViewed: string;
  createdAt: string;
}

export interface DashboardStats {
  totalReviews: number;
  averageScore: number;
  favoriteLanguage: string;
  totalLinesReviewed?: number;
  bugsDetected?: number;
  securityIssues?: number;
  averageResponseTime?: number;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}
