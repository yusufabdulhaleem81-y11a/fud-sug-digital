import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homeForRole } from '../lib/routing';
import { Spinner } from '../components/ui';
import type { UserRole } from '../types/models';

export default function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile.is_active)
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-xl font-bold">Account deactivated</h1>
          <p className="mt-2 text-sm text-stone-500">Contact the SUG administrator.</p>
        </div>
      </div>
    );
  if (!roles.includes(profile.role)) return <Navigate to={homeForRole(profile.role)} replace />;
  return <>{children}</>;
}