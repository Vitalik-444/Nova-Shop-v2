import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function RequireAuth({ children }) {
  const { user, ready } = useApp();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
