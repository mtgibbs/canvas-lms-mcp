/**
 * Service layer types
 * These types define the input/output contracts for all services.
 * Both CLI commands and MCP tools use these same types.
 */

// Common result types that services return

export interface CourseGrade {
  id: number;
  name: string;
  course_code: string;
  current_score: number | null;
  current_grade: string | null;
  final_score: number | null;
  final_grade: string | null;
  /** The grading period ID these grades are from (if available) */
  grading_period_id?: number;
}

export interface DueAssignment {
  course_id: number;
  course_name: string;
  assignment_id: number;
  assignment_name: string;
  due_at: string;
  points_possible: number | null;
  submitted: boolean;
  score: number | null;
  grade: string | null;
  url?: string;
}

export interface MissingAssignment {
  id: number;
  name: string;
  course_id: number;
  course_name: string;
  due_at: string | null;
  points_possible: number | null;
  url: string;
}

export interface UnsubmittedAssignment {
  id: number;
  name: string;
  course_id: number;
  course_name: string;
  due_at: string | null;
  points_possible: number | null;
  url?: string;
}

export interface GradedAssignment {
  course_id: number;
  course_name: string;
  assignment_id: number;
  assignment_name: string;
  graded_at: string | null;
  score: number | null;
  points_possible: number;
  percentage: number | null;
  grade: string | null;
  late: boolean;
  url?: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  course_id: number;
  course_name: string;
  author_name: string;
  url: string;
}

export interface InboxItem {
  id: number;
  subject: string | null;
  last_message: string | null;
  last_message_at: string | null;
  message_count: number;
  workflow_state: "read" | "unread" | "archived";
  participants: string[];
  context_name: string | null;
}

export interface CalendarEventItem {
  id: number;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location_name: string | null;
  location_address: string | null;
  course_id: number;
  course_name: string;
  url: string;
}

export interface TeacherCommunications {
  announcements: AnnouncementItem[];
  inbox: InboxItem[];
}

export interface ComprehensiveStatus {
  summary: {
    total_courses: number;
    missing_assignments: number;
    upcoming_assignments: number;
    recent_low_grades: number;
    recent_announcements: number;
  };
  courses: Array<{
    id: number;
    name: string;
    current_score: number | null;
    current_grade: string | null;
    final_score: number | null;
    final_grade: string | null;
  }>;
  missing_assignments: MissingAssignment[];
  upcoming_assignments: DueAssignment[];
  recent_low_grades: GradedAssignment[];
  recent_announcements: AnnouncementItem[];
}

export interface CourseStats {
  course_id: number;
  course_name: string;
  late_count: number;
  missing_count: number;
  total_assignments: number;
}

export interface ObservedStudent {
  id: number;
  name: string;
  short_name: string;
  sortable_name: string;
}

export interface MultiStudentStatus {
  student_name: string;
  student_id: number;
  status: ComprehensiveStatus;
}

export interface FeedbackItem {
  assignment_id: number;
  assignment_name: string;
  course_id: number;
  course_name: string;
  comment_text: string;
  author_name: string;
  comment_date: string;
  student_score: number | null;
  points_possible: number | null;
  grade: string | null;
  url: string;
}
