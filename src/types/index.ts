// User and Authentication Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  github_username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter_username?: string;
  linkedin_url?: string;
  current_role?: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  learning_goals?: string[];
  preferred_languages?: string[];
  timezone?: string;
  is_mentor: boolean;
  mentor_specialties?: string[];
  mentor_bio?: string;
  mentor_hourly_rate?: number;
  mentor_availability?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Learning Types
export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  prerequisites?: string[];
  skills_covered: string[];
  image_url?: string;
  is_featured: boolean;
  enrollment_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  track_id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  estimated_duration: number; // in minutes
  type: 'reading' | 'video' | 'exercise' | 'project' | 'quiz';
  resources?: Resource[];
  prerequisites?: string[];
  learning_objectives: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'link' | 'file' | 'video' | 'book';
  url: string;
  description?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  track_id: string;
  module_id?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  time_spent: number; // in minutes
  last_accessed: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// AI Mentor Types
export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  message_type: 'question' | 'code_review' | 'explanation' | 'debugging';
  code_snippet?: string;
  programming_language?: string;
  context?: string;
  rating?: number;
  feedback?: string;
  created_at: string;
}

export interface CodeReview {
  id: string;
  user_id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  review_type: 'general' | 'performance' | 'security' | 'best_practices';
  ai_feedback: string;
  suggestions: CodeSuggestion[];
  rating?: number;
  user_feedback?: string;
  status: 'pending' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CodeSuggestion {
  line_number?: number;
  type: 'improvement' | 'bug' | 'optimization' | 'style';
  message: string;
  suggested_code?: string;
  severity: 'low' | 'medium' | 'high';
}

// GitHub Integration Types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  language?: string;
  languages?: Record<string, number>;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export interface GitHubStats {
  public_repos: number;
  followers: number;
  following: number;
  total_stars: number;
  total_forks: number;
  contributions_last_year: number;
  most_used_languages: Record<string, number>;
  recent_activity: GitHubActivity[];
}

export interface GitHubActivity {
  type: string;
  repo: string;
  action: string;
  date: string;
}

// Project Types
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  github_repo_url?: string;
  live_demo_url?: string;
  technologies: string[];
  status: 'planning' | 'in_progress' | 'completed' | 'archived';
  visibility: 'public' | 'private';
  featured: boolean;
  image_url?: string;
  readme_content?: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectSubmission {
  id: string;
  project_id: string;
  user_id: string;
  submission_type: 'review' | 'showcase' | 'competition';
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  feedback?: string;
  score?: number;
  reviewer_id?: string;
  submitted_at: string;
  reviewed_at?: string;
}

// Mentorship Types
export interface Mentor {
  id: string;
  user_id: string;
  specialties: string[];
  experience_years: number;
  bio: string;
  hourly_rate?: number;
  availability: string;
  rating: number;
  total_sessions: number;
  languages_spoken: string[];
  timezone: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface MentorshipRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  mentee: User;
  mentor: User;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  goals: string[];
  notes?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  mentor: User;
  mentee: User;
}

export interface MentorshipSession {
  id: string;
  mentorship_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  feedback?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface DashboardAnalytics {
  learning_progress: {
    completed_modules: number;
    total_modules: number;
    current_streak: number;
    weekly_goal: number;
    weekly_progress: number;
    recent_activity: LearningActivity[];
  };
  github_activity: {
    repositories: number;
    commits_this_week: number;
    stars_received: number;
    contributions_this_year: number;
    recent_commits: GitHubCommit[];
  };
  mentorship: {
    active_mentorships: number;
    upcoming_sessions: number;
    total_sessions_completed: number;
    average_rating: number;
  };
  ai_mentor: {
    questions_asked: number;
    code_reviews_completed: number;
    helpful_responses: number;
    average_response_time: number;
  };
}

export interface LearningActivity {
  id: string;
  type: 'module_completed' | 'track_started' | 'quiz_passed' | 'project_submitted';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PlatformAnalytics {
  users: {
    total: number;
    active_this_month: number;
    new_this_month: number;
    retention_rate: number;
  };
  learning: {
    total_enrollments: number;
    completion_rate: number;
    average_progress: number;
    popular_tracks: Array<{ track_id: string; title: string; enrollments: number }>;
  };
  mentorship: {
    total_mentors: number;
    total_sessions: number;
    average_rating: number;
    success_rate: number;
  };
  projects: {
    total_projects: number;
    public_projects: number;
    featured_projects: number;
    average_likes: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdateForm {
  full_name: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter_username?: string;
  linkedin_url?: string;
  current_role?: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  learning_goals?: string[];
  preferred_languages?: string[];
  timezone?: string;
}

// Filter and Search Types
export interface LearningTrackFilters {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: 'short' | 'medium' | 'long'; // weeks
  skills?: string[];
  featured?: boolean;
  search?: string;
}

export interface MentorFilters {
  specialties?: string[];
  experience_years?: number;
  hourly_rate_max?: number;
  languages?: string[];
  timezone?: string;
  availability?: boolean;
  rating_min?: number;
  search?: string;
}

export interface ProjectFilters {
  technologies?: string[];
  status?: 'planning' | 'in_progress' | 'completed';
  visibility?: 'public' | 'private';
  featured?: boolean;
  search?: string;
}