import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import MessagePopup from '../components/common/MessagePopup';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '', icon: 'error' });

  const validateEmail = (value) => {
    // simple email regex
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        // show generic message to user, but keep useful debug in console
        const message = data && data.message ? data.message : 'Failed to send reset link';
        console.error('Forgot password error:', data);
        setPopupData({ title: 'Error', message, icon: 'error' });
        setPopupOpen(true);
        setLoading(false);
        return;
      }

      // success - show submitted view (generic message to avoid enumeration)
      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password request failed:', err);
      setPopupData({ title: 'Network error', message: 'Unable to send reset email. Please try again later.', icon: 'error' });
      setPopupOpen(true);
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
        <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-8">
          <div className="max-w-sm">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80" 
              alt="Forgot password"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            {!isSubmitted ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                    Forgot Password
                  </h2>
                  <p className="text-gray-600">Enter your email to reset your password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Remember your password?{" "}
                    <Link
                      to="/login"
                      className="text-red-500 hover:text-red-600 underline"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors"
                  >
                    Try Another Email
                  </button>
                  
                  <Link
                    to="/login"
                    className="block w-full text-center text-red-500 hover:text-red-600 font-medium py-3 px-4 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;