import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import { User, Phone, Mail, MapPin, Calendar, Star, Package, Clock, Trophy, AlertTriangle } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // User data state
  const [userInfo, setUserInfo] = useState({
    user_id: null,
    username: '',
    email: '',
    full_name: '',
    phone: '',
    avatar_url: '',
    address: '',
    role: '',
    status: '',
    rating: 0,
    total_orders: 0,
    email_verified: false,
    last_login_at: null,
    created_at: null
  });

  // Stats data (placeholder for now, can be fetched from orders/rentals API later)
  const [stats, setStats] = useState([
    { label: 'Total Rentals', value: '0', color: 'text-orange-500' },
    { label: 'Hours Used', value: '0', color: 'text-yellow-500' },
    { label: 'Rating', value: '0', color: 'text-green-500' },
    { label: 'Member Since', value: '0 Days', color: 'text-blue-500' }
  ]);

  // Activities data (placeholder for now, can be fetched from orders API later)
  const [activities, setActivities] = useState([]);

  // Add API functions
  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...'); // Debug log
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Response data:', data); // Debug log
      
      if (data.success && data.data) {
        const userData = data.data;
        
        // Map API response to our state structure (matching database schema)
        setUserInfo({
          user_id: userData.user_id,
          username: userData.username || '',
          email: userData.email || '',
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || `https://ui-avatars.com/api/?name=${userData.username || 'User'}&background=random&size=200`,
          address: userData.address || '',
          role: userData.role || '',
          status: userData.status || '',
          rating: parseFloat(userData.rating || 0),
          total_orders: userData.total_orders || 0,
          email_verified: userData.email_verified || false,
          last_login_at: userData.last_login_at,
          created_at: userData.created_at
        });

        // Calculate member since
        if (userData.created_at) {
          const createdDate = new Date(userData.created_at);
          const now = new Date();
          const diffTime = Math.abs(now - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let memberSince = '';
          if (diffDays < 30) {
            memberSince = `${diffDays} Days`;
          } else if (diffDays < 365) {
            memberSince = `${Math.floor(diffDays / 30)} Months`;
          } else {
            memberSince = `${Math.floor(diffDays / 365)} Years`;
          }
          
        // Update stats with real data
        setStats([
          { label: 'Total Orders', value: (userData.total_orders || 0).toString(), color: 'text-orange-500' },
          { label: 'Email Verified', value: userData.email_verified ? 'Yes' : 'No', color: 'text-yellow-500' },
          { label: 'Rating', value: (parseFloat(userData.rating || 0)).toFixed(1), color: 'text-green-500' },
          { label: 'Member Since', value: memberSince, color: 'text-blue-500' }
        ]);
        }
      } else {
        setError(data.message || 'Failed to fetch user data');
        if (response.status === 401) {
          navigate('/login');
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (updatedData) => {
    try {
      setSaving(true);
      setError(null);
      
      // Only include fields that are provided in updatedData
      const apiData = {};
      
      if (updatedData.hasOwnProperty('username')) apiData.username = updatedData.username;
      if (updatedData.hasOwnProperty('email')) apiData.email = updatedData.email;
      if (updatedData.hasOwnProperty('full_name')) apiData.full_name = updatedData.full_name;
      if (updatedData.hasOwnProperty('phone')) apiData.phone = updatedData.phone;
      if (updatedData.hasOwnProperty('avatar_url')) apiData.avatar_url = updatedData.avatar_url;
      if (updatedData.hasOwnProperty('address')) apiData.address = updatedData.address;

      // Remove empty string fields (but keep null/undefined if explicitly set)
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === '') {
          delete apiData[key];
        }
      });

      const response = await fetch(`/api/users/${userInfo.user_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh user data after successful update
        await fetchUserData();
        setIsEditing(false);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const statsWithIcons = stats.map((stat, index) => {
    const icons = [Package, Mail, Star, Trophy]; // Package for orders, Mail for verification, Star for rating, Trophy for member since
    return {
      ...stat,
      icon: icons[index] || Package
    };
  });

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    await updateUserData(userInfo);
  };

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload to S3
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload avatar');
      }

      const uploadData = await uploadResponse.json();
      const avatarUrl = uploadData.data.url;

      // Show preview
      setAvatarPreview(avatarUrl);
      
      // Update local state
      setUserInfo(prev => ({
        ...prev,
        avatar_url: avatarUrl
      }));

      // Auto-save avatar - only send the avatar_url field
      await updateUserData({ avatar_url: avatarUrl });
      
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  fetchUserData();
                }}
                className="ml-auto text-red-500 hover:text-red-700 text-sm underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Profile Content - Only show when not loading */}
        {!loading && (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <button
                  onClick={isEditing ? handleSaveProfile : handleEditProfile}
                  disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
                </button>
              </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
            <div className="relative">
              <img
                src={avatarPreview || userInfo.avatar_url}
                alt="Profile Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              {isEditing && (
                <label className={`absolute bottom-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors ${uploadingAvatar ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {userInfo.full_name || userInfo.username || 'User'}
            </h2>
            <p className="text-gray-600">{userInfo.email}</p>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{userInfo.username || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{userInfo.full_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{userInfo.phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{userInfo.email}</p>
                    {userInfo.email_verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{userInfo.rating ? parseFloat(userInfo.rating).toFixed(1) : '0.0'}</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(parseFloat(userInfo.rating || 0)) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div> */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                {isEditing ? (
                  <textarea
                    value={userInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{userInfo.address || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 capitalize">{userInfo.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  userInfo.status === 'active' ? 'bg-green-100 text-green-800' :
                  userInfo.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {userInfo.status ? userInfo.status.charAt(0).toUpperCase() + userInfo.status.slice(1) : 'Unknown'}
                </span>
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Orders</label>
                <p className="text-gray-900">{userInfo.total_orders}</p>
              </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                <p className="text-gray-900">
                  {userInfo.last_login_at ? new Date(userInfo.last_login_at).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        {/* <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsWithIcons.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div> */}

        {/* Recent Activity */}
        {/* <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-500' : 
                    activity.status === 'active' ? 'bg-blue-500' : 'bg-yellow-500'
                  } mt-2`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.color}`}>
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div> */}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfilePage;