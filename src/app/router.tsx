import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PortalLayout from '../layouts/PortalLayout';
import RequireRole from '../guards/RequireRole';

import Home from '../pages/public/Home';
import Administrations from '../pages/public/Administrations';
import AdministrationDetail from '../pages/public/AdministrationDetail';
import History from '../pages/public/History';
import Login from '../pages/auth/Login';
import NotFound from '../pages/NotFound';

import AdministrationsManager from '../pages/shared/AdministrationsManager';
import ExcoManagement from '../pages/shared/ExcoManagement';
import PhasePlaceholder from '../pages/shared/PhasePlaceholder';
import CaseInbox from '../pages/shared/CaseInbox';
import CaseDetail from '../pages/shared/CaseDetail';
import SuggestionsPanel from '../pages/shared/SuggestionsPanel';
import TasksPanel from '../pages/shared/TasksPanel';
import MonthlyReportsPanel from '../pages/shared/MonthlyReportsPanel';
import DirectivesPanel from '../pages/shared/DirectivesPanel';
import EscalationsPanel from '../pages/shared/EscalationsPanel';
import InterventionsPanel from '../pages/shared/InterventionsPanel';
import ProfilePage from '../pages/shared/ProfilePage';

import StudentDashboard from '../pages/student/StudentDashboard';
import NewReport from '../pages/student/NewReport';
import StudentReports from '../pages/student/StudentReports';
import StudentComplaints from '../pages/student/StudentComplaints';
import StudentSuggestions from '../pages/student/StudentSuggestions';

import ExcoDashboard from '../pages/exco/ExcoDashboard';
import VpDashboard from '../pages/vp/VpDashboard';
import PresidentDashboard from '../pages/president/PresidentDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

const ph = (title: string, phase: string) => <PhasePlaceholder title={title} phase={phase} />;

export const router = createBrowserRouter([
  // ---------- PUBLIC ----------
  { element: <PublicLayout />, children: [
    { path: '/', element: <Home /> },
    { path: '/history', element: <History /> },
    { path: '/administrations', element: <Administrations /> },
    { path: '/administrations/:session', element: <AdministrationDetail /> },
    { path: '/achievements', element: ph('Public Achievements', 'Phase E') },
    { path: '/projects', element: ph('Public Projects', 'Phase E') },
    { path: '/updates', element: ph('Updates & Announcements', 'Phase E') },
    { path: '/events', element: ph('Events', 'Phase E') },
    { path: '/about', element: ph('About SUG Digital', 'Phase H') },
    { path: '*', element: <NotFound /> },
  ]},

  // ---------- AUTH ----------
  { path: '/login', element: <Login /> },
  { path: '/student/login', element: <Navigate to="/login" replace /> },
  { path: '/exco/login', element: <Navigate to="/login" replace /> },
  { path: '/vp/login', element: <Navigate to="/login" replace /> },
  { path: '/president/login', element: <Navigate to="/login" replace /> },
  { path: '/admin/login', element: <Navigate to="/login" replace /> },

  // ---------- STUDENT ----------
  { path: '/student', element: <RequireRole roles={['student']}><PortalLayout portal="student" /></RequireRole>, children: [
    { path: 'dashboard', element: <StudentDashboard /> },
    { path: 'reports', element: <StudentReports /> },
    { path: 'reports/new', element: <NewReport /> },
    { path: 'reports/:id', element: <CaseDetail kind="report" mode="student" /> },
    { path: 'complaints', element: <StudentComplaints /> },
    { path: 'complaints/:id', element: <CaseDetail kind="complaint" mode="student" /> },
    { path: 'suggestions', element: <StudentSuggestions /> },
    { path: 'requests', element: ph('My Requests', 'Phase D') },
    { path: 'notifications', element: ph('Notifications', 'Phase G') },
    { path: 'posts', element: ph('Posts', 'Phase E') },
    { path: 'events', element: ph('Events', 'Phase E') },
    { path: 'profile', element: <ProfilePage /> },
  ]},

  // ---------- EXCO ----------
  { path: '/exco', element: <RequireRole roles={['exco', 'vp', 'president']}><PortalLayout portal="exco" /></RequireRole>, children: [
    { path: 'dashboard', element: <ExcoDashboard /> },
    { path: 'reports', element: <CaseInbox kind="report" scope="assigned" /> },
    { path: 'reports/:id', element: <CaseDetail kind="report" mode="exco" /> },
    { path: 'complaints', element: <CaseInbox kind="complaint" scope="assigned" /> },
    { path: 'complaints/:id', element: <CaseDetail kind="complaint" mode="exco" /> },
    { path: 'suggestions', element: <SuggestionsPanel /> },
    { path: 'tasks', element: <TasksPanel mode="officer" /> },
    { path: 'monthly-reports', element: <MonthlyReportsPanel mode="officer" /> },
    { path: 'directives', element: <DirectivesPanel mode="officer" /> },
    { path: 'requests', element: ph('Requests', 'Phase D') },
    { path: 'proposals', element: ph('Proposals', 'Phase D') },
    { path: 'notifications', element: ph('Notifications', 'Phase G') },
    { path: 'messages', element: ph('Messages', 'Phase G') },
    { path: 'documents', element: ph('Documents', 'Phase G') },
    { path: 'posts', element: ph('Posts', 'Phase E') },
    { path: 'events', element: ph('Events', 'Phase E') },
    { path: 'profile', element: <ProfilePage /> },
  ]},

  // ---------- VP ----------
  { path: '/vp', element: <RequireRole roles={['vp', 'president']}><PortalLayout portal="vp" /></RequireRole>, children: [
    { path: 'dashboard', element: <VpDashboard /> },
    { path: 'reports', element: <CaseInbox kind="report" scope="administration" /> },
    { path: 'reports/:id', element: <CaseDetail kind="report" mode="president" /> },
    { path: 'directives', element: <DirectivesPanel mode="officer" /> },
    { path: 'tasks', element: <TasksPanel mode="leadership" /> },
    { path: 'coordination', element: <TasksPanel mode="leadership" /> },
    { path: 'escalations', element: <EscalationsPanel /> },
    { path: 'notifications', element: ph('Notifications', 'Phase G') },
    { path: 'profile', element: <ProfilePage /> },
  ]},

  // ---------- PRESIDENT ----------
  { path: '/president', element: <RequireRole roles={['president']}><PortalLayout portal="president" /></RequireRole>, children: [
    { path: 'dashboard', element: <PresidentDashboard /> },
    { path: 'exco-management', element: <ExcoManagement /> },
    { path: 'administration', element: <AdministrationsManager /> },
    { path: 'reports', element: <CaseInbox kind="report" scope="administration" /> },
    { path: 'reports/:id', element: <CaseDetail kind="report" mode="president" /> },
    { path: 'complaints', element: <CaseInbox kind="complaint" scope="administration" /> },
    { path: 'complaints/:id', element: <CaseDetail kind="complaint" mode="president" /> },
    { path: 'suggestions', element: <SuggestionsPanel /> },
    { path: 'monthly-reports', element: <MonthlyReportsPanel mode="president" /> },
    { path: 'requests', element: ph('Requests', 'Phase D') },
    { path: 'proposals', element: ph('Proposals', 'Phase D') },
    { path: 'tasks', element: <TasksPanel mode="leadership" /> },
    { path: 'directives', element: <DirectivesPanel mode="president" /> },
    { path: 'escalations', element: <EscalationsPanel /> },
    { path: 'interventions', element: <InterventionsPanel /> },
    { path: 'projects', element: ph('Projects', 'Phase E') },
    { path: 'achievements', element: ph('Achievements', 'Phase E') },
    { path: 'analytics', element: ph('Analytics', 'Phase H') },
    { path: 'transition', element: ph('Transition & Handover', 'Phase F') },
    { path: 'audit-logs', element: ph('Audit Logs', 'Phase H') },
    { path: 'notifications', element: ph('Notifications', 'Phase G') },
    { path: 'profile', element: <ProfilePage /> },
  ]},

  // ---------- ADMIN ----------
  { path: '/admin', element: <RequireRole roles={['admin', 'super_admin']}><PortalLayout portal="admin" /></RequireRole>, children: [
    { path: 'dashboard', element: <AdminDashboard /> },
    { path: 'administrations', element: <AdministrationsManager /> },
    { path: 'exco-management', element: <ExcoManagement /> },
    { path: 'users', element: ph('Users', 'Phase H') },
    { path: 'roles', element: ph('Roles', 'Phase H') },
    { path: 'permissions', element: ph('Permissions', 'Phase H') },
    { path: 'directorates', element: ph('Directorates', 'Phase H') },
    { path: 'positions', element: ph('Positions', 'Phase H') },
    { path: 'routing', element: ph('Report Routing', 'Phase B part 2') },
    { path: 'verification', element: ph('Verification Policy', 'Phase B part 2') },
    { path: 'notifications', element: ph('Notifications', 'Phase G') },
    { path: 'documents', element: ph('Documents', 'Phase G') },
    { path: 'settings', element: ph('Institution Settings', 'Phase H') },
    { path: 'audit-logs', element: ph('Audit Logs', 'Phase H') },
  ]},
]);