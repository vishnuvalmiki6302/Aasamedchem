// src/components/ProtectedRoute.jsx — Route guard for authenticated users
// Redirects to /login if not logged in; optionally requires admin role

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/seller/products" replace />;
  }

  return children;
}
