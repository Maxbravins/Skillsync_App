import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ children, role }) => {
  const {
    user,
    loading,
    isAuthenticated,
    token,
  } = useAuth();

  console.log({
    loading,
    token,
    user,
    isAuthenticated,
  });

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;