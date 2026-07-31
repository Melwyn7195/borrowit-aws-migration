import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import { API_BASE } from '../api/config';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('FORM SUBMIT TRIGGERED!'); // Debug log
    setError(null);
    setLoading(true);
    console.log('Login submitted:', formData); //debug log

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Login failed response:', { status: res.status, body: data });

        // Detect specific error messages
        if (res.status === 404 || (data && typeof data.message === 'string' && /(not found|not exist|user.*not.*exist)/i.test(data.message))) {
          setError('User not exist');
        } else if (res.status === 409 || (data && typeof data.message === 'string' && /already.*exist/i.test(data.message))) {
          setError('User already exists');
        } else if (res.status === 401) {
          setError('Invalid email/username or password');
        } else {
          setError(data.message || `Request failed with status ${res.status}`);
        }
        return;
      }

      console.log('Login success:', data);
      
      // Session-based auth - no need to store tokens
      // Just redirect and let Header component handle session check
      if (data.success) {
        // Trigger custom event to update header
        window.dispatchEvent(new CustomEvent('loginSuccess'));
        
        // Fetch user info to get role
        try {
          const userRes = await fetch('/api/users/me', {
            credentials: 'include',
            cache: 'no-cache'
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            console.log('User data from /me:', userData); // Debug log
            
            const userRole = userData.data?.role;
            console.log('Redirecting user with role:', userRole); // Debug log
            
            if (userRole === 'admin') {
               setTimeout(() => {
                 console.log('Navigating to admin...');
                 navigate('/admin');
               }, 100);
            } else if (userRole === 'seller') {
               setTimeout(() => {
                 console.log('Navigating to seller dashboard...');
                 navigate('/seller/dashboard');
               }, 100);
            } else {
              setTimeout(() => {
                console.log('Navigating to home...');
                navigate('/');
              }, 100);
            }
          } else {
            console.log('userRes not ok, trying to get role from login response...');
            // Try to get role from login response
            const userRole = data.data?.user?.role;
            console.log('Role from login response:', userRole);
            
            if (userRole === 'admin') {
               setTimeout(() => {
                 console.log('Navigating to admin...');
                 navigate('/admin');
               }, 100);
            } else if (userRole === 'seller') {
               setTimeout(() => {
                 console.log('Navigating to seller dashboard...');
                 navigate('/seller/dashboard');
               }, 100);
            } else {
              setTimeout(() => {
                console.log('Navigating to home...');
                navigate('/');
              }, 100);
            }
          }
        } catch (meError) {
          console.error('Error fetching user info:', meError);
          // Fallback to home
          setTimeout(() => {
            console.log('Error fallback navigation to home...');
            navigate('/');
          }, 100);
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-160px)]">
        {/* Left Side - Image */}
        <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=900&q=80" 
            alt="Shopping and online payment"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">Enter your details below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="identifier"
                  placeholder="Email or Username"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-900 transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-900 transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-12 rounded-md transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
                <Link 
                  to="/forgot-password"
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Forget Password?
                </Link>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-red-500 hover:text-red-600 underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LoginPage;