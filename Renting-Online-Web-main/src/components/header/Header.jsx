import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  UserRound,
  LogOut,
  IdCard,
  User,
  LogIn,
  UserPlus,
  Settings,
} from "lucide-react";

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Check session status on component mount
  useEffect(() => {
    checkSessionStatus();
  }, []);

  // Listen for login events to refresh session
  useEffect(() => {
    const handleLoginSuccess = () => {
      checkSessionStatus();
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, []);

  const checkSessionStatus = async () => {
    try {
      const sessionRes = await fetch('/api/users/me', {
        credentials: 'include',
        cache: 'no-cache'
      });
      
      if (!sessionRes.ok && sessionRes.status !== 304) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      const userData = await sessionRes.json().catch(() => null);

      if (userData && userData.success && userData.sessionValid) {

          setUser(userData.data);
          setIsAuthenticated(true);
        }
      else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking session status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
    
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(null);
        setIsAuthenticated(false);
        setShowUserMenu(false);
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setShowUserMenu(false);
      navigate('/');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render header for admin users
  if (user?.role === 'admin') {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Prevent full page reload
    if (searchTerm.trim()) {
      // Navigate to home page with the search query

      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // If search is empty, navigate to home without query
      navigate('/');
    }
  };

  return (
    <header className="w-full bg-white relative">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="flex h-16 items-center gap-3">
          {/* Left: Logo */}
          <Link to="/" className="shrink-0 select-none" aria-label="Borrowit home">
            <span className="text-2xl font-black tracking-tight leading-none">BORROWIT</span>
          </Link>

          {/* Middle: Search */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-2xl">
              <form onSubmit={handleSearchSubmit}>
                <label htmlFor="site-search" className="sr-only">Search for products</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    id="site-search"
                    type="text"
                    placeholder="Search for products..."
                    className="w-full rounded-full bg-gray-100 pl-11 pr-4 h-10 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-4 relative" ref={userMenuRef}>
            <button
              type="button"
              aria-label="Cart"
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-6 w-6" />
            </button>

            {/* User Icon + Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Account"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <UserRound className="h-6 w-6" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50">
                  <ul className="py-1 text-sm text-gray-700">
                    {loading ? (
                      <li className="px-4 py-2 text-center text-gray-500">
                        Loading...
                      </li>
                    ) : !isAuthenticated ? (
                      // Show only Login and Sign Up when not authenticated
                      <>
                        <li>
                          <button
                            onClick={() => {
                              navigate('/login');
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <LogIn className="h-5 w-5" /> Login
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              navigate('/signup');
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <UserPlus className="h-5 w-5" /> Sign Up
                          </button>
                        </li>
                      </>
                    ) : (
                      // Show user menu when authenticated
                      <>
                        {/* Welcome message */}
                        <li className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                          Welcome, {user?.username || user?.email}
                        </li>
                        
                        <li>
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <User className="h-5 w-5" /> Profile
                          </button>
                        </li>
                        
                        <li>
                          <button
                            onClick={() => {
                              navigate('/orders');
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <ShoppingCart className="h-5 w-5" /> My Orders
                          </button>
                        </li>

                        {/* Show admin dashboard only for admin role */}
                        {user?.role === 'admin' && (
                          <li>
                            <button
                              onClick={() => {
                                navigate('/admin');
                                setShowUserMenu(false);
                              }}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                            >
                              <Settings className="h-5 w-5" /> Admin Dashboard
                            </button>
                          </li>
                        )}

                        {/* Show seller dashboard only for seller role */}
                        {user?.role === 'seller' && (
                          <li>
                            <button
                              onClick={() => {
                                navigate('/seller');
                                setShowUserMenu(false);
                              }}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                            >
                              <IdCard className="h-5 w-5" /> Seller Dashboard
                            </button>
                          </li>
                        )}

                        {/* Logout button */}
                        <li className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 w-full text-left text-red-600 hover:text-red-700"
                          >
                            <LogOut className="h-5 w-5" /> Log Out
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}