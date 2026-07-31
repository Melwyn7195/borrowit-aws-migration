import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('ProtectedRoute: Checking auth...');
      const response = await fetch('/api/users/me', {
        credentials: 'include',
        cache: 'no-cache'
      });
      
      console.log('ProtectedRoute: Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('ProtectedRoute: User data:', userData);
        if (userData.success && userData.sessionValid) {
          setUser(userData.data);
          console.log('ProtectedRoute: User set:', userData.data);
        } else {
          console.log('ProtectedRoute: Session not valid');
        }
      } else {
        console.log('ProtectedRoute: Response not ok');
      }
    } catch (error) {
      console.error('ProtectedRoute: Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin restriction - can only access specific admin routes
  if (user.role === 'admin') {
    const currentPath = location.pathname;
    const allowedAdminRoutes = [
      '/admin',
      '/admin/dashboard',
      '/admin/users', 
      '/admin/resolve-violations'
    ];
    
    const isAllowedRoute = allowedAdminRoutes.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );
    
    if (!isAllowedRoute) {
      console.log(`Admin trying to access forbidden route: ${currentPath}, redirecting to /admin`);
      return <Navigate to="/admin" replace />;
    }
  }

  if (user.role === 'seller') {
    const currentPath = location.pathname;
    const allowedSellerRoutes = [
      '/seller',
      '/seller/dashboard',
      '/seller/products',
      '/seller/orders',
    ];

    const isAllowedRoute = allowedSellerRoutes.some(route =>
      currentPath === route || currentPath.startsWith(route + '/')
    );
    
    if (!isAllowedRoute) {
      console.log(`Seller trying to access forbidden route: ${currentPath}, redirecting to /seller`);
      return <Navigate to="/seller" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;