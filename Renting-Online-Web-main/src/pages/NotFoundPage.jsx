import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-300 mb-4">404</h1>
          <div className="w-24 h-1 bg-black mx-auto mb-8"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Go to Homepage
          </Link>
          
           
        </div>
    </div>
        
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-gray-200 rounded-full opacity-20"></div>
        <div className="absolute top-1/4 -right-8 w-32 h-32 bg-gray-200 rounded-full opacity-10"></div>
        <div className="absolute -bottom-6 left-1/3 w-20 h-20 bg-gray-200 rounded-full opacity-15"></div>
      </div>
    </div>
  );
}