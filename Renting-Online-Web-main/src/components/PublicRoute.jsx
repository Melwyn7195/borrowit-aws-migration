import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('PublicRoute: Checking if user is already logged in...');
      const response = await fetch('/api/users/me', {
        credentials: 'include',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('PublicRoute: User data:', userData);
        if (userData.success && userData.sessionValid) {
          setUser(userData.data);
          console.log('PublicRoute: User already logged in:', userData.data);
        }
      }
    } catch (error) {
      console.error('PublicRoute: Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // If user is already logged in, redirect based on their role
  if (user) {
    console.log('PublicRoute: User is logged in, redirecting based on role:', user.role);
    
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // User not logged in, show the public page (login/signup)
  return children;
};

export default PublicRoute;