import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/** Route guard: redirects non-admin users to /home */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/home" replace />;
  
  return <>{children}</>;
};

export default AdminRoute;
