import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function MePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 animate-pulse rounded-full bg-cream/80" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/users/${user.id}`} replace />;
}
