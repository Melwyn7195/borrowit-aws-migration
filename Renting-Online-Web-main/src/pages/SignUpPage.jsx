import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer'
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
    setError(null);
    setLoading(true);
    console.log('SignUp submitted:', formData);

    try {  
      const res = await fetch('/api/users/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Register failed response:', { status: res.status, body: data });

        // Handle specific errors from backend
        if (res.status === 400) {
          if (data.message && data.message.includes('User already exists')) {
            setError('User already exists with this email');
          } else if (data.message && data.message.includes('Username is already taken')) {
            setError('Username is already taken');
          } else {
            setError(data.message || 'Registration failed');
          }
        } else {
          setError(data.message || `Request failed with status ${res.status}`);
        }
        return;
      }

      console.log('Register success:', data);
      
      // Store token if provided
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }

      // Redirect to login or home page
      navigate('/login');
    } catch (err) {
      console.error('Register error:', err);
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
        <div className="flex-1 bg-gradient-to-br from-purple-100 to-pink-200 relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=900&q=80" 
            alt="Shopping bags and lifestyle"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right Side - SignUp Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                Create an account
              </h2>
              <p className="text-gray-600">Enter your details below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-900 transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
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

              <div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:outline-none focus:border-gray-900 transition-colors"
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have account?{" "}
                <Link
                  to="/login"
                  className="text-red-500 hover:text-red-600 underline"
                >
                  Log in
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

export default SignUpPage;