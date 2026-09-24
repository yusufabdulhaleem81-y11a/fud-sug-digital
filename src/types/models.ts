export type UserRole = 'student' | 'exco' | 'vp' | 'president' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  verification: string;
  is_active: boolean;
}

export type AdministrationStatus =
  | 'planned' | 'upcoming' | 'current' | 'transitioning' | 'completed' | 'archived';

export interface Administration {
  id: string;
  name: string;
  academic_session: string;
  short_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: AdministrationStatus;
  theme: string | null;
  description: string | null;
  priorities: string[] | null;
  president_id: string | null;
  vice_president_id: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Position {
  id: string; title: string; slug: string; rank: number;
}

export interface Directorate {
  id: string; name: string; slug: string; description: string | null;
}

export interface OfficerRecord {
  id: string;
  administration_id: string;
  user_id: string;
  position_id: string;
  directorate_id: string | null;
  display_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  biography: string | null;
  profile_photo_url: string | null;
  display_in_archive: boolean;
  position?: Position;
  directorate?: Directorate | null;
}

export interface Project {
  id: string; title: string; description: string | null; status: string;
  category: string | null; start_date: string | null; completion_date: string | null;
  expected_completion_date: string | null; impact: string | null;
}

export interface Achievement {
  id: string; title: string; description: string; achievement_date: string | null;
  category: string | null; impact: string | null;
}